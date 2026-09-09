<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Models\Room;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MasterController extends Controller
{
    public function locations()
    {
        $user = auth()->user();
        $query = Location::with('unit')->latest();
        $this->applyUnitFilter($query);

        $rows = $query->get()->map(fn ($item, $index) => [
            'id' => (string) $item->id,
            'no' => $index + 1,
            'nama' => $item->name,
            'alamat' => $item->description ?? '-',
            'unit' => $item->unit?->name ?? '',
        ]);

        $unitsQuery = Unit::orderBy('name');
        if ($user && $user->hasRole('admin_unit')) {
            $unitsQuery->where('id', $user->unit_id);
        }
        $units = $unitsQuery->get()->map(fn ($item) => ['id' => (string) $item->id, 'name' => $item->name]);

        return Inertia::render('Master/Lokasi', ['rows' => $rows, 'units' => $units]);
    }

    public function showLocation(Location $location)
    {
        $location->load(['unit', 'rooms']);

        return Inertia::render('Master/DetailLokasi', [
            'lokasi' => [
                'id' => (string) $location->id,
                'nama' => $location->name,
                'alamat' => $location->description ?? '-',
                'unit' => $location->unit?->name ?? '',
                'status' => $location->status === 'aktif' ? 'Aktif' : 'Nonaktif',
                'created_at' => $location->created_at?->format('d M Y') ?? '-',
                'updated_at' => $location->updated_at?->format('d M Y') ?? '-',
                'rooms' => $location->rooms->map(fn ($room) => [
                    'id' => (string) $room->id,
                    'nama' => $room->name,
                    'kode' => $room->code ?? '-',
                    'status' => $room->status === 'aktif' ? 'Aktif' : ($room->status === 'aktif_full' || $room->status === 'full' || $room->status === 'penuh' ? 'Aktif & Full' : 'Nonaktif'),
                ])->values()->all(),
            ],
        ]);
    }

    public function editLocation(Location $location)
    {
        $units = Unit::orderBy('name')->get()->map(fn ($item) => ['id' => (string) $item->id, 'name' => $item->name]);

        return Inertia::render('Master/EditLokasi', [
            'lokasi' => [
                'id' => (string) $location->id,
                'name' => $location->name,
                'description' => $location->description ?? '',
                'unit_id' => $location->unit_id ? (string) $location->unit_id : '',
                'status' => $location->status ?? 'aktif',
            ],
            'units' => $units,
        ]);
    }

    public function storeLocation(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
        ]);

        $user = Auth::user();
        if ($user && $user->hasRole('admin_unit')) {
            // admin_unit may only create locations for their own unit
            $unitId = $user->unit_id;
            if ($data['unit_id'] && (string) $data['unit_id'] !== (string) $unitId) {
                abort(403, 'Akses tidak diizinkan: hanya boleh menambah lokasi untuk unit sendiri.');
            }
            $data['unit_id'] = $unitId;
        }

        $location = Location::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'unit_id' => $data['unit_id'] ?? null,
            'status' => $data['status'] ?? 'aktif',
        ]);

        $this->logActivity('create', 'Menambah lokasi "' . $location->name . '"', Location::class, (int) $location->id);

        return redirect('/master/lokasi')->with('success', 'Lokasi berhasil ditambah.');
    }

    public function updateLocation(Request $request, Location $location)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
        ]);

        $user = Auth::user();
        if ($user && $user->hasRole('admin_unit')) {
            // admin_unit may only update locations belonging to their unit
            $unitId = $user->unit_id;
            if ((string) $location->unit_id !== (string) $unitId) {
                abort(403, 'Akses tidak diizinkan: hanya boleh mengubah lokasi untuk unit sendiri.');
            }
            if (isset($data['unit_id']) && (string) $data['unit_id'] !== (string) $unitId) {
                abort(403, 'Akses tidak diizinkan: tidak dapat memindahkan lokasi ke unit lain.');
            }
            $data['unit_id'] = $unitId;
        }

        $location->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'unit_id' => $data['unit_id'] ?? null,
            'status' => $data['status'] ?? 'aktif',
        ]);

        $this->logActivity('update', 'Memperbarui lokasi "' . $location->name . '"', Location::class, (int) $location->id);

        return redirect('/master/lokasi')->with('success', 'Lokasi berhasil diubah.');
    }

    public function destroyLocation(Location $location)
    {
        $user = Auth::user();
        if ($user && $user->hasRole('admin_unit')) {
            if ((string) $location->unit_id !== (string) $user->unit_id) {
                abort(403, 'Akses tidak diizinkan: hanya boleh menghapus lokasi untuk unit sendiri.');
            }
        }

        try {
            $locationName = $location->name;
            $location->delete();

            $this->logActivity('delete', 'Menghapus lokasi "' . $locationName . '"', Location::class, (int) $location->id);

            return redirect('/master/lokasi')->with('success', 'Lokasi berhasil dihapus.');
        } catch (\Throwable $e) {
            return back()->withErrors(['message' => 'Gagal menghapus lokasi.']);
        }
    }

    public function rooms()
    {
        $query = Room::with(['location.unit'])->latest()->limit(20000);
        $this->applyUnitFilter($query);

        $rows = $query->get()->map(fn ($item, $index) => [
            'id' => (string) $item->id,
            'no' => $index + 1,
            'nama' => $item->name,
            'location_id' => $item->location_id ? (string) $item->location_id : '-',
            'unit_id' => $item->unit_id ? (string) $item->unit_id : ($item->location?->unit?->id ? (string) $item->location->unit->id : '-'),
            'kode' => $item->code ?? '-',
            'lantai' => $item->floor ?? '-',
            'deskripsi' => $item->description ?? '-',
            'status' => $item->status === 'aktif' ? 'Aktif' : ($item->status === 'aktif_full' || $item->status === 'full' || $item->status === 'penuh' ? 'Aktif & Full' : 'Nonaktif'),
            'lokasi' => $item->location?->name ?? '-',
            'unit' => $item->unit?->name ?? $item->location?->unit?->name ?? '-',
            'created_at' => $item->created_at?->format('Y-m-d') ?? '-',
            'updated_at' => $item->updated_at?->format('Y-m-d') ?? '-',
        ]);

        return Inertia::render('Master/Ruangan', ['rows' => $rows]);
    }

    public function createRoom()
    {
        $user = auth()->user();
        $unitsQuery = Unit::orderBy('name');
        if ($user && $user->hasRole('admin_unit')) {
            $unitsQuery->where('id', $user->unit_id);
        }
        $units = $unitsQuery->get()->map(fn ($item) => ['id' => (string) $item->id, 'name' => $item->name]);

        $locationsQuery = Location::orderBy('name');
        $this->applyUnitFilter($locationsQuery);
        $locations = $locationsQuery->get()->map(fn ($item) => ['id' => (string) $item->id, 'name' => $item->name, 'unit_id' => $item->unit_id ? (string) $item->unit_id : '']);

        return Inertia::render('Master/CreateRuangan', [
            'units' => $units,
            'locations' => $locations,
        ]);
    }

    public function storeRoom(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'location_id' => ['required', 'integer', 'exists:locations,id'],
            'unit_id' => ['required', 'integer', 'exists:units,id'],
            'code' => ['nullable', 'string', 'max:100'],
            'floor' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:aktif,full,nonaktif,penuh'],
        ]);

        $user = Auth::user();
        if ($user && $user->hasRole('admin_unit')) {
            // admin_unit may only create rooms for their own unit
            if ((string) $data['unit_id'] !== (string) $user->unit_id) {
                abort(403, 'Akses tidak diizinkan: hanya boleh menambah ruangan untuk unit sendiri.');
            }
        }

        $selectedLocation = Location::find($data['location_id']);

        if ($selectedLocation && $selectedLocation->unit_id && (string) $selectedLocation->unit_id !== (string) $data['unit_id']) {
            return back()->withErrors(['location_id' => 'Lokasi harus sesuai dengan unit yang dipilih.']);
        }

        $room = Room::create([
            'name' => $data['name'],
            'location_id' => $data['location_id'],
            'unit_id' => $data['unit_id'],
            'code' => $data['code'] ?? null,
            'floor' => $data['floor'] ?? null,
            'description' => $data['description'] ?? null,
            'status' => in_array($data['status'] ?? 'aktif', ['aktif_full', 'full', 'penuh'], true) ? 'full' : ($data['status'] ?? 'aktif'),
        ]);

        $this->logActivity('create', 'Menambah ruangan "' . $room->name . '"', Room::class, (int) $room->id);

        return redirect('/master/ruangan')->with('success', 'Ruangan berhasil ditambah.');
    }

    public function showRoom(Room $room)
    {
        $room->load(['location.unit', 'unit', 'assets']);

        return Inertia::render('Master/DetailRuangan', [
            'ruangan' => [
                'id' => (string) $room->id,
                'nama' => $room->name,
                'location_id' => $room->location_id ? (string) $room->location_id : '-',
                'location_name' => $room->location?->name ?? '-',
                'unit_id' => $room->unit_id ? (string) $room->unit_id : ($room->location?->unit?->id ? (string) $room->location->unit->id : '-'),
                'unit_name' => $room->unit?->name ?? $room->location?->unit?->name ?? '-',
                'kode' => $room->code ?? '-',
                'lantai' => $room->floor ?? '-',
                'deskripsi' => $room->description ?? '-',
                'status' => $room->status === 'aktif' ? 'Aktif' : ($room->status === 'aktif_full' || $room->status === 'full' || $room->status === 'penuh' ? 'Aktif & Full' : 'Nonaktif'),
                'created_at' => $room->created_at?->format('d M Y') ?? '-',
                'updated_at' => $room->updated_at?->format('d M Y') ?? '-',
                'assets' => $room->assets->map(fn ($asset) => [
                    'id' => (string) $asset->id,
                    'kode' => $asset->kode_aset ?? '-',
                    'nama' => $asset->nama_aset ?? '-',
                    'jumlah' => $asset->jumlah ?? 0,
                    'kondisi' => $asset->kondisi ?? '-',
                    'status' => $asset->status ?? '-',
                ])->values()->all(),
            ],
        ]);
    }

    public function editRoom(Room $room)
    {
        $room->load(['location', 'unit']);

        $locations = Location::orderBy('name')->get()->map(fn ($item) => [
            'id' => (string) $item->id,
            'name' => $item->name,
            'unit_id' => $item->unit_id ? (string) $item->unit_id : '',
        ]);

        $units = Unit::orderBy('name')->get()->map(fn ($item) => [
            'id' => (string) $item->id,
            'name' => $item->name,
        ]);

        return Inertia::render('Master/EditRuangan', [
            'ruangan' => [
                'id' => (string) $room->id,
                'name' => $room->name,
                'location_id' => $room->location_id ? (string) $room->location_id : '',
                'unit_id' => $room->unit_id ? (string) $room->unit_id : ($room->location?->unit_id ? (string) $room->location->unit_id : ''),
                'kode' => $room->code ?? '',
                'lantai' => $room->floor ?? '',
                'deskripsi' => $room->description ?? '',
                'status' => in_array($room->status, ['full', 'penuh', 'aktif_full'], true) ? 'full' : ($room->status ?? 'aktif'),
            ],
            'locations' => $locations,
            'units' => $units,
        ]);
    }

    public function updateRoom(Request $request, Room $room)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'code' => ['nullable', 'string', 'max:100'],
            'floor' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:aktif,full,nonaktif,penuh'],
        ]);

        $user = Auth::user();
        if ($user && $user->hasRole('admin_unit')) {
            // admin_unit may only update rooms that belong to their unit
            if ((string) $room->unit_id !== (string) $user->unit_id) {
                abort(403, 'Akses tidak diizinkan: hanya boleh mengubah ruangan untuk unit sendiri.');
            }
            if (isset($data['unit_id']) && (string) $data['unit_id'] !== (string) $user->unit_id) {
                abort(403, 'Akses tidak diizinkan: tidak dapat memindahkan ruangan ke unit lain.');
            }
            $data['unit_id'] = $user->unit_id;
        }

        $selectedLocation = $data['location_id'] ? Location::find($data['location_id']) : null;
        $selectedUnitId = $data['unit_id'] ?? ($selectedLocation?->unit_id ?? $room->unit_id ?? null);

        if ($selectedLocation && $selectedUnitId && (string) $selectedLocation->unit_id !== (string) $selectedUnitId) {
            return back()->withErrors(['location_id' => 'Lokasi harus sesuai dengan unit yang dipilih.']);
        }

        $room->update([
            'name' => $data['name'],
            'location_id' => $data['location_id'] ?? $room->location_id,
            'unit_id' => $selectedUnitId,
            'code' => $data['code'] ?? $room->code,
            'floor' => $data['floor'] ?? $room->floor,
            'description' => $data['description'] ?? $room->description,
            'status' => in_array($data['status'] ?? $room->status, ['aktif_full', 'full', 'penuh'], true) ? 'full' : ($data['status'] ?? $room->status),
        ]);

        $this->logActivity('update', 'Memperbarui ruangan "' . $room->name . '"', Room::class, (int) $room->id);

        return redirect('/master/ruangan')->with('success', 'Ruangan berhasil diubah.');
    }

    public function destroyRoom(Room $room)
    {
        $user = Auth::user();
        if ($user && $user->hasRole('admin_unit')) {
            if ((string) $room->unit_id !== (string) $user->unit_id) {
                abort(403, 'Akses tidak diizinkan: hanya boleh menghapus ruangan untuk unit sendiri.');
            }
        }

        try {
            $roomName = $room->name;
            $room->delete();

            $this->logActivity('delete', 'Menghapus ruangan "' . $roomName . '"', Room::class, (int) $room->id);

            return redirect('/master/ruangan')->with('success', 'Ruangan berhasil dihapus.');
        } catch (\Throwable $e) {
            return back()->withErrors(['message' => 'Gagal menghapus ruangan.']);
        }
    }

    public function units()
    {
        $user = auth()->user();
        $query = Unit::latest();

        // If the authenticated user is an admin of a unit, only show their own unit
        if ($user && $user->hasRole('admin_unit')) {
            $query->where('id', $user->unit_id);
        }

        $rows = $query->get()->map(fn ($item, $index) => [
            'id' => (string) $item->id,
            'no' => $index + 1,
            'namaUnit' => $item->name,
            'kepalaUnit' => $item->leader_name ?? '-',
            'tipe' => $item->type ?? '-',
            'alamat' => $item->address ?? '-',
            'status' => $item->status === 'aktif' ? 'Aktif' : ($item->status === 'perlu_review' ? 'Perlu Review' : 'Tidak Aktif'),
            'created_at' => $item->created_at?->format('Y-m-d') ?? '-',
            'updated_at' => $item->updated_at?->format('Y-m-d') ?? '-',
        ]);

        return Inertia::render('Unit/Index', ['rows' => $rows]);
    }

    public function create()
    {
        return Inertia::render('Unit/Create');
    }

    public function show(Unit $unit)
    {
        return Inertia::render('Unit/Show', [
            'unit' => [
                'id' => (string) $unit->id,
                'code' => $unit->code,
                'name' => $unit->name,
                'leader_name' => $unit->leader_name,
                'type' => $unit->type,
                'address' => $unit->address ?? '-',
                'status' => $unit->status,
                'created_at' => $unit->created_at?->format('Y-m-d') ?? '-',
                'updated_at' => $unit->updated_at?->format('Y-m-d') ?? '-',
            ],
        ]);
    }

    public function edit(Unit $unit)
    {
        return Inertia::render('Unit/Edit', [
            'unit' => [
                'id' => (string) $unit->id,
                'code' => $unit->code,
                'name' => $unit->name,
                'leader_name' => $unit->leader_name,
                'type' => $unit->type,
                'address' => $unit->address,
                'status' => $unit->status,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:150'],
            'leader_name' => ['nullable', 'string', 'max:150'],
            'type' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'status' => ['nullable', 'in:aktif,nonaktif,perlu_review'],
        ]);

        $unit = Unit::create($data);

        $this->logActivity('create', 'Menambah unit "' . $unit->name . '"', Unit::class, (int) $unit->id);

        return redirect('/unit')->with('success', 'Unit berhasil ditambah.');
    }

    public function update(Request $request, Unit $unit)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:150'],
            'leader_name' => ['nullable', 'string', 'max:150'],
            'type' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'status' => ['nullable', 'in:aktif,nonaktif,perlu_review'],
        ]);

        $user = Auth::user();
        if ($user && $user->hasRole('admin_unit')) {
            // admin_unit may only update their own unit
            if ((string) $unit->id !== (string) $user->unit_id) {
                abort(403, 'Akses tidak diizinkan: hanya boleh mengubah unit sendiri.');
            }
        }

        $unit->update($data);

        $this->logActivity('update', 'Memperbarui unit "' . $unit->name . '"', Unit::class, (int) $unit->id);

        return redirect('/unit')->with('success', 'Unit berhasil diubah.');
    }

    public function destroy(Unit $unit)
    {
        $user = Auth::user();
        if ($user && $user->hasRole('admin_unit')) {
            // admin_unit may only delete their own unit
            if ((string) $unit->id !== (string) $user->unit_id) {
                abort(403, 'Akses tidak diizinkan: hanya boleh menghapus unit sendiri.');
            }
        }

        try {
            $unitName = $unit->name;
            $unit->delete();

            $this->logActivity('delete', 'Menghapus unit "' . $unitName . '"', Unit::class, (int) $unit->id);

            return redirect('/unit')->with('success', 'Unit berhasil dihapus.');
        } catch (\Throwable $e) {
            return back()->withErrors(['message' => 'Gagal menghapus unit.']);
        }
    }

    public function distribution()
    {
        $units = Unit::with([
            'location',
            'assets' => fn ($query) => $query->select([
                'id',
                'unit_id',
                'jumlah',
                'jumlah_baik',
                'jumlah_rusak_ringan',
                'jumlah_rusak_berat',
                'jumlah_dalam_perbaikan',
            ]),
        ])->get();

        $allAssetsCount = $units->sum(fn ($unit) => $unit->assets->sum(fn ($asset) => (int) ($asset->jumlah ?? 0)));

        $rows = $units->map(function ($unit) use ($allAssetsCount) {
            $assets = $unit->assets;
            $total = $assets->sum(fn ($asset) => (int) ($asset->jumlah ?? 0));
            $good = $assets->sum(fn ($asset) => (int) ($asset->jumlah_baik ?? 0));
            $rusakRingan = $assets->sum(fn ($asset) => (int) ($asset->jumlah_rusak_ringan ?? 0));
            $rusakBerat = $assets->sum(fn ($asset) => (int) ($asset->jumlah_rusak_berat ?? 0));
            $dalamPerbaikan = $assets->sum(fn ($asset) => (int) ($asset->jumlah_dalam_perbaikan ?? 0));
            $damaged = $rusakRingan + $rusakBerat + $dalamPerbaikan;

            $status = 'Baik';
            if ($rusakBerat > 0) {
                $status = 'Rusak Berat';
            } elseif ($dalamPerbaikan > 0) {
                $status = 'Dalam Perbaikan';
            } elseif ($rusakRingan > 0) {
                $status = 'Rusak Ringan';
            } elseif ($good > 0 && $good === $total) {
                $status = 'Baik';
            }

            return [
                'id' => (string) $unit->id,
                'unit' => $unit->name,
                'total' => $total,
                'good' => $good,
                'rusak_ringan' => $rusakRingan,
                'rusak_berat' => $rusakBerat,
                'dalam_perbaikan' => $dalamPerbaikan,
                'damaged' => $damaged,
                'status' => $status,
                'percent' => $allAssetsCount > 0 ? round(($total / $allAssetsCount) * 100) : 0,
            ];
        })->filter(fn ($row) => $row['total'] > 0)->sortByDesc('total')->values()->all();

        return Inertia::render('Unit/Distribusi', ['rows' => $rows]);
    }
}
