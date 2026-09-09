<?php

namespace App\Http\Controllers;

use App\Models\AsetInventaris;
use App\Models\AssetBorrowing;
use App\Models\AssetMutation;
use App\Models\Location;
use App\Models\Room;
use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            $user = auth()->user();

            if ($user && $user->hasRole('admin_unit')) {
                // Check AssetMutation route-model binding
                $routeMutation = $request->route('assetMutation') ?? $request->route('asset_mutation') ?? null;
                if ($routeMutation) {
                    $mutation = $routeMutation instanceof AssetMutation ? $routeMutation : AssetMutation::find($routeMutation);
                    if ($mutation) {
                        $from = $mutation->from_unit_id ?? null;
                        $to = $mutation->to_unit_id ?? null;
                        if ($from !== $user->unit_id && $to !== $user->unit_id) {
                            abort(403);
                        }
                    }
                }

                // Check AssetBorrowing route-model binding
                $routeBorrowing = $request->route('assetBorrowing') ?? $request->route('asset_borrowing') ?? null;
                if ($routeBorrowing) {
                    $borrowing = $routeBorrowing instanceof AssetBorrowing ? $routeBorrowing : AssetBorrowing::find($routeBorrowing);
                    if ($borrowing && ($borrowing->borrower_unit_id ?? null) !== ($user->unit_id ?? null)) {
                        abort(403);
                    }
                }
            }

            return $next($request);
        })->only(['edit', 'update', 'destroy', 'editBorrowing', 'updateBorrowing', 'destroyBorrowing']);
    }

    private function resolveMutationStatus(?string $movementType, ?string $status): string
    {
        if (($movementType ?? '') === 'Pemindahan Unit') {
            return 'proses';
        }

        return in_array($status, ['proses', 'sukses', 'gagal'], true)
            ? $status
            : 'proses';
    }

    private function applyMutationAssetTransfer(AssetMutation $mutation): void
    {
        $asset = AsetInventaris::find($mutation->asset_id);

        if (!$asset) {
            return;
        }

        $asset->update([
            'unit_id' => $mutation->to_unit_id ?? $asset->unit_id,
            'lokasi_id' => $mutation->to_location_id ?? $asset->lokasi_id,
            'room_id' => $mutation->to_room_id ?? $asset->room_id,
        ]);
    }

    public function mutations()
    {
        $user = auth()->user();

        $query = AssetMutation::with(['asset', 'fromUnit', 'toUnit', 'fromLocation', 'toLocation', 'fromRoom', 'toRoom'])->latest();

        if ($user && $user->hasRole('admin_unit')) {
            $query->where(function ($q) use ($user) {
                $q->where('from_unit_id', $user->unit_id)
                  ->orWhere('to_unit_id', $user->unit_id);
            });
        }

        $rows = $query->get()->map(fn ($item, $index) => [
            'id' => (string) $item->id,
            'no' => $index + 1,
            'aset' => $item->asset?->nama_aset ?? $item->asset?->name ?? '-',
            'kode' => $item->asset?->kode_aset ?? $item->asset?->asset_code ?? '-',
            'jenis' => $item->movement_type ?? 'Pemindahan Unit',
            'dari' => $item->fromUnit?->name
                ?? $item->fromRoom?->name
                ?? $item->fromLocation?->name
                ?? 'Unit Utama',
            'ke' => $item->toUnit?->name
                ?? $item->toRoom?->name
                ?? $item->toLocation?->name
                ?? 'Unit Tujuan',
            'from_unit_id' => $item->from_unit_id ? (string) $item->from_unit_id : '',
            'to_unit_id' => $item->to_unit_id ? (string) $item->to_unit_id : '',
            'tanggal' => $item->mutation_date?->format('Y-m-d') ?? now()->format('Y-m-d'),
            'status' => match ($item->status) {
                'proses' => 'Proses',
                'sukses' => 'Sukses',
                'ditolak', 'gagal' => 'Gagal',
                'selesai' => 'Sukses',
                default => 'Proses',
            },
        ]);

        return Inertia::render('Transactions/Mutasi', ['rows' => $rows]);
    }

    public function create()
    {
        $user = auth()->user();

        $processingMutationAssetIds = AssetMutation::where('status', 'proses')
            ->pluck('asset_id');
        $assetQuery = AsetInventaris::whereNotIn('id', $processingMutationAssetIds)->orderBy('nama_aset');
        $this->applyUnitFilter($assetQuery);
        $assets = $assetQuery->get()->map(fn ($item) => [
            'id' => (string) $item->id,
            'name' => $item->nama_aset,
            'kode' => $item->kode_aset,
            'jumlah' => $item->jumlah,
            'unit_id' => $item->unit_id ? (string) $item->unit_id : null,
            'location_id' => $item->lokasi_id ? (string) $item->lokasi_id : null,
            'room_id' => $item->room_id ? (string) $item->room_id : null,
        ]);

        $units = Unit::orderBy('name')->get()->map(fn ($item) => [
            'id' => (string) $item->id,
            'name' => $item->name,
        ]);

        $locations = Location::orderBy('name')->get()->map(fn ($item) => [
            'id' => (string) $item->id,
            'name' => $item->name,
            'code' => $item->code,
            'unit_id' => $item->unit_id ? (string) $item->unit_id : null,
        ]);

        $rooms = Room::with('location')->orderBy('name')->limit(1000)->get()->map(fn ($item) => [
            'id' => (string) $item->id,
            'name' => $item->name,
            'code' => $item->code,
            'location_id' => $item->location_id ? (string) $item->location_id : null,
            'unit_id' => $item->unit_id ? (string) $item->unit_id : null,
            'location_name' => $item->location?->name ?? '-',
            'status' => $item->status ?? 'aktif',
        ]);

        return Inertia::render('Transactions/Mutasi/Create', [
            'assets' => $assets,
            'units' => $units,
            'locations' => $locations,
            'rooms' => $rooms,
            'current_unit_id' => $user && $user->hasRole('admin_unit') ? (string) ($user->unit_id ?? '') : null,
            'current_unit_name' => $user && $user->hasRole('admin_unit') ? ($user->unit?->name ?? '') : null,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $currentUnitId = $user && $user->hasRole('admin_unit') ? (int) ($user->unit_id ?? 0) : null;

        $data = $request->validate([
            'asset_id' => ['required', 'integer', 'exists:aset_inventaris,id'],
            'from_unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'to_unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'from_location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'to_location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'from_room_id' => ['nullable', 'integer', 'exists:rooms,id'],
            'to_room_id' => ['nullable', 'integer', 'exists:rooms,id'],
            'movement_type' => ['required', 'string', 'max:100'],
            'mutation_date' => ['required', 'date'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:proses,sukses,gagal,selesai,ditolak'],
        ]);

        $data['status'] = $this->resolveMutationStatus($data['movement_type'] ?? null, $data['status'] ?? null);

        if (AssetMutation::where('asset_id', $data['asset_id'])->where('status', 'proses')->exists()) {
            return back()->withErrors([
                'asset_id' => 'Aset ini sedang dalam proses mutasi dan tidak dapat diajukan kembali.',
            ])->withInput();
        }

        if ($user && $user->hasRole('admin_unit') && $currentUnitId) {
            $data['from_unit_id'] = $data['from_unit_id'] ?? $currentUnitId;
            $data['to_unit_id'] = $data['to_unit_id'] ?? $currentUnitId;

            if ((int) ($data['from_unit_id'] ?? 0) !== $currentUnitId) {
                return back()->withErrors(['from_unit_id' => 'Unit asal harus sesuai dengan unit Anda.']);
            }
        }

        $movementType = $data['movement_type'];
        $asset = AsetInventaris::findOrFail($data['asset_id']);

        if ($movementType === 'Pindah Lokasi') {
            $data['from_location_id'] = $asset->lokasi_id;
        } elseif ($movementType === 'Pindah Ruangan') {
            $data['from_room_id'] = $asset->room_id;
        }

        if ($movementType === 'Pemindahan Unit') {
            $fromUnitId = (int) ($data['from_unit_id'] ?? 0);
            $toUnitId = (int) ($data['to_unit_id'] ?? 0);

            if ($fromUnitId > 0 && $toUnitId > 0 && $fromUnitId === $toUnitId) {
                $isOwnUnitMutation = $user && $user->hasRole('admin_unit') && $currentUnitId && $fromUnitId === $currentUnitId && $toUnitId === $currentUnitId;
                if (!$isOwnUnitMutation) {
                    return back()->withErrors(['to_unit_id' => 'Unit tujuan tidak boleh sama dengan unit asal.']);
                }
            }

            if ($user && $user->hasRole('admin_unit') && $currentUnitId && $movementType === 'Pemindahan Unit' && $toUnitId === $currentUnitId) {
                return back()->withErrors(['to_unit_id' => 'Unit tujuan tidak boleh sama dengan unit Anda.']);
            }
        }

        if ($movementType === 'Pemindahan Unit') {
            $toUnitId = (int) ($data['to_unit_id'] ?? 0);
            $toLocationId = (int) ($data['to_location_id'] ?? 0);
            $toRoomId = (int) ($data['to_room_id'] ?? 0);

            if (!$toLocationId) {
                return back()->withErrors(['to_location_id' => 'Lokasi tujuan wajib dipilih.'])->withInput();
            }
            if (!$toRoomId) {
                return back()->withErrors(['to_room_id' => 'Ruangan tujuan wajib dipilih.'])->withInput();
            }
            if (Location::whereKey($toLocationId)->where('unit_id', $toUnitId)->doesntExist()) {
                return back()->withErrors(['to_location_id' => 'Lokasi tujuan harus dimiliki unit tujuan.'])->withInput();
            }
            if (Room::whereKey($toRoomId)->where('unit_id', $toUnitId)->where('location_id', $toLocationId)->doesntExist()) {
                return back()->withErrors(['to_room_id' => 'Ruangan tujuan harus berada di lokasi dan unit tujuan.'])->withInput();
            }
            if (Room::whereKey($toRoomId)->where('status', 'aktif')->doesntExist()) {
                return back()->withErrors(['to_room_id' => 'Ruangan tujuan sedang penuh atau tidak aktif. Pilih ruangan aktif.'])->withInput();
            }
        }

        if ($movementType === 'Pindah Lokasi') {
            $fromLocationId = (int) ($data['from_location_id'] ?? 0);
            $toLocationId = (int) ($data['to_location_id'] ?? 0);
            $assetUnitId = (int) (AsetInventaris::whereKey($data['asset_id'])->value('unit_id') ?? 0);

            if ($fromLocationId > 0 && $toLocationId > 0 && $fromLocationId === $toLocationId) {
                return back()->withErrors(['to_location_id' => 'Lokasi tujuan tidak boleh sama dengan lokasi asal.']);
            }
            if ($assetUnitId > 0 && Location::whereKey($fromLocationId)->where('unit_id', $assetUnitId)->doesntExist()) {
                return back()->withErrors(['from_location_id' => 'Lokasi asal harus dimiliki unit aset.']);
            }
            if ($assetUnitId > 0 && Location::whereKey($toLocationId)->where('unit_id', $assetUnitId)->doesntExist()) {
                return back()->withErrors(['to_location_id' => 'Lokasi tujuan harus dimiliki unit aset.']);
            }
        }

        if ($movementType === 'Pindah Ruangan') {
            $fromRoomId = (int) ($data['from_room_id'] ?? 0);
            $toRoomId = (int) ($data['to_room_id'] ?? 0);
            $assetUnitId = (int) (AsetInventaris::whereKey($data['asset_id'])->value('unit_id') ?? 0);

            if ($fromRoomId > 0 && $toRoomId > 0 && $fromRoomId === $toRoomId) {
                return back()->withErrors(['to_room_id' => 'Ruangan tujuan tidak boleh sama dengan ruangan asal.']);
            }
            if ($assetUnitId > 0 && Room::whereKey($fromRoomId)->where('unit_id', $assetUnitId)->doesntExist()) {
                return back()->withErrors(['from_room_id' => 'Ruangan asal harus dimiliki unit aset.']);
            }
            if ($assetUnitId > 0 && Room::whereKey($toRoomId)->where('unit_id', $assetUnitId)->doesntExist()) {
                return back()->withErrors(['to_room_id' => 'Ruangan tujuan harus dimiliki unit aset.']);
            }
            if (Room::whereKey($toRoomId)->where('status', 'aktif')->doesntExist()) {
                return back()->withErrors(['to_room_id' => 'Ruangan tujuan sedang penuh atau tidak aktif. Pilih ruangan aktif.']);
            }
        }

        $mutation = AssetMutation::create([
            'asset_id' => $data['asset_id'],
            'asset_type' => 'AsetInventaris',
            'from_unit_id' => $data['from_unit_id'] ?? null,
            'to_unit_id' => $data['to_unit_id'] ?? null,
            'from_location_id' => $data['from_location_id'] ?? null,
            'to_location_id' => $data['to_location_id'] ?? null,
            'from_room_id' => $data['from_room_id'] ?? null,
            'to_room_id' => $data['to_room_id'] ?? null,
            'movement_type' => $data['movement_type'],
            'reference_number' => $data['reference_number'] ?? null,
            'mutation_date' => $data['mutation_date'],
            'notes' => $data['notes'] ?? null,
            'status' => $data['status'],
        ]);
        $assetName = AsetInventaris::find($mutation->asset_id)?->nama_aset ?? 'Aset';
        $this->logActivity(
            $mutation->movement_type === 'Pemindahan Unit' ? 'request' : 'mutasi',
            ($mutation->movement_type === 'Pemindahan Unit' ? 'Mengajukan pemindahan' : 'Membuat mutasi') . ' aset "' . $assetName . '" dari unit ' . ($mutation->from_unit_id ?? '-') . ' ke unit ' . ($mutation->to_unit_id ?? '-') . ' dengan status ' . $mutation->status . '.',
            AssetMutation::class,
            (int) $mutation->id,
        );

        $redirectUrl = $user && $user->hasRole('admin_unit') && $currentUnitId ? '/unit/' . $currentUnitId : '/mutasi';

        return redirect($redirectUrl)->with('success', 'Mutasi aset berhasil ditambahkan.');
    }

    public function show(AssetMutation $assetMutation)
    {
        $asset = $assetMutation->asset;

        return Inertia::render('Transactions/Mutasi/Show', [
            'mutation' => [
                'id' => (string) $assetMutation->id,
                'asset_id' => $assetMutation->asset_id ? (string) $assetMutation->asset_id : '',
                'asset_name' => $asset?->nama_aset ?? $asset?->name ?? 'Aset tidak ditemukan',
                'asset_code' => $asset?->kode_aset ?? $asset?->kode ?? '-',
                'movement_type' => $assetMutation->movement_type ?? 'Pemindahan Unit',
                'from_unit' => $assetMutation->fromUnit?->name ?? '-',
                'to_unit' => $assetMutation->toUnit?->name ?? '-',
                'from_location' => $assetMutation->fromLocation?->name ?? '-',
                'to_location' => $assetMutation->toLocation?->name ?? '-',
                'from_room' => $assetMutation->fromRoom?->name ?? '-',
                'to_room' => $assetMutation->toRoom?->name ?? '-',
                'reference_number' => $assetMutation->reference_number ?? '-',
                'mutation_date' => $assetMutation->mutation_date?->format('Y-m-d') ?? '-',
                'notes' => $assetMutation->notes ?? '-',
                'status' => $assetMutation->status ?? 'proses',
                'created_at' => $assetMutation->created_at?->format('Y-m-d H:i:s') ?? '-',
                'updated_at' => $assetMutation->updated_at?->format('Y-m-d H:i:s') ?? '-',
            ],
        ]);
    }

    public function edit(AssetMutation $assetMutation)
    {
        $processingMutationAssetIds = AssetMutation::where('status', 'proses')
            ->where('id', '!=', $assetMutation->id)
            ->pluck('asset_id');
        $assetQuery = AsetInventaris::whereNotIn('id', $processingMutationAssetIds)->orderBy('nama_aset');
        $this->applyUnitFilter($assetQuery);
        $assets = $assetQuery->get()->map(fn ($item) => [
            'id' => (string) $item->id,
            'name' => $item->nama_aset,
            'kode' => $item->kode_aset,
            'unit_id' => $item->unit_id ? (string) $item->unit_id : null,
            'location_id' => $item->lokasi_id ? (string) $item->lokasi_id : null,
            'room_id' => $item->room_id ? (string) $item->room_id : null,
        ]);

        $user = auth()->user();
        $units = Unit::orderBy('name')->get()->map(fn ($item) => [
            'id' => (string) $item->id,
            'name' => $item->name,
        ]);

        $locations = Location::orderBy('name')->get()->map(fn ($item) => [
            'id' => (string) $item->id,
            'name' => $item->name,
            'code' => $item->code,
            'unit_id' => $item->unit_id ? (string) $item->unit_id : null,
        ]);

        $rooms = Room::with('location')->orderBy('name')->limit(1000)->get()->map(fn ($item) => [
            'id' => (string) $item->id,
            'name' => $item->name,
            'code' => $item->code,
            'unit_id' => $item->unit_id ? (string) $item->unit_id : null,
            'location_name' => $item->location?->name ?? '-',
            'status' => $item->status ?? 'aktif',
        ]);

        $user = auth()->user();
        $currentUnitId = $user && $user->hasRole('admin_unit') ? (int) ($user->unit_id ?? 0) : null;

        return Inertia::render('Transactions/Mutasi/Edit', [
            'mutation' => [
                'id' => (string) $assetMutation->id,
                'asset_id' => (string) $assetMutation->asset_id,
                'from_unit_id' => $assetMutation->from_unit_id ? (string) $assetMutation->from_unit_id : '',
                'to_unit_id' => $assetMutation->to_unit_id ? (string) $assetMutation->to_unit_id : '',
                'from_location_id' => $assetMutation->from_location_id ? (string) $assetMutation->from_location_id : '',
                'to_location_id' => $assetMutation->to_location_id ? (string) $assetMutation->to_location_id : '',
                'from_room_id' => $assetMutation->from_room_id ? (string) $assetMutation->from_room_id : '',
                'to_room_id' => $assetMutation->to_room_id ? (string) $assetMutation->to_room_id : '',
                'movement_type' => $assetMutation->movement_type ?? 'Pemindahan Unit',
                'mutation_date' => $assetMutation->mutation_date?->format('Y-m-d') ?? '',
                'reference_number' => $assetMutation->reference_number ?? '',
                'notes' => $assetMutation->notes ?? '',
                'status' => $assetMutation->status ?? 'proses',
            ],
            'assets' => $assets,
            'units' => $units,
            'locations' => $locations,
            'rooms' => $rooms,
            'current_unit_id' => $user && $user->hasRole('admin_unit') ? (string) ($user->unit_id ?? '') : null,
        ]);
    }

    public function update(Request $request, AssetMutation $assetMutation)
    {
        $user = auth()->user();
        $currentUnitId = $user && $user->hasRole('admin_unit') ? (int) ($user->unit_id ?? 0) : null;

        $data = $request->validate([
            'asset_id' => ['required', 'integer', 'exists:aset_inventaris,id'],
            'from_unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'to_unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'from_location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'to_location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'from_room_id' => ['nullable', 'integer', 'exists:rooms,id'],
            'to_room_id' => ['nullable', 'integer', 'exists:rooms,id'],
            'movement_type' => ['required', 'string', 'max:100'],
            'mutation_date' => ['required', 'date'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:proses,sukses,gagal,selesai,ditolak'],
        ]);

        $data['status'] = $this->resolveMutationStatus($data['movement_type'] ?? null, $data['status'] ?? null);

        if (AssetMutation::where('asset_id', $data['asset_id'])
            ->where('status', 'proses')
            ->where('id', '!=', $assetMutation->id)
            ->exists()) {
            return back()->withErrors([
                'asset_id' => 'Aset ini sedang dalam proses mutasi lain dan tidak dapat dipilih.',
            ])->withInput();
        }

        if ($user && $user->hasRole('admin_unit') && $currentUnitId) {
            $data['from_unit_id'] = $data['from_unit_id'] ?? $currentUnitId;
            $data['to_unit_id'] = $data['to_unit_id'] ?? $currentUnitId;

            if ((int) ($data['from_unit_id'] ?? 0) !== $currentUnitId) {
                return back()->withErrors(['from_unit_id' => 'Unit asal harus sesuai dengan unit Anda.']);
            }
        }

        $movementType = $data['movement_type'];
        $asset = AsetInventaris::findOrFail($data['asset_id']);

        if ($movementType === 'Pindah Lokasi') {
            $data['from_location_id'] = $asset->lokasi_id;
        } elseif ($movementType === 'Pindah Ruangan') {
            $data['from_room_id'] = $asset->room_id;
        }

        if ($movementType === 'Pemindahan Unit') {
            $fromUnitId = (int) ($data['from_unit_id'] ?? 0);
            $toUnitId = (int) ($data['to_unit_id'] ?? 0);

            if ($fromUnitId > 0 && $toUnitId > 0 && $fromUnitId === $toUnitId) {
                $isOwnUnitMutation = $user && $user->hasRole('admin_unit') && $currentUnitId && $fromUnitId === $currentUnitId && $toUnitId === $currentUnitId;
                if (!$isOwnUnitMutation) {
                    return back()->withErrors(['to_unit_id' => 'Unit tujuan tidak boleh sama dengan unit asal.']);
                }
            }

            if ($user && $user->hasRole('admin_unit') && $currentUnitId && $movementType === 'Pemindahan Unit' && $toUnitId === $currentUnitId) {
                return back()->withErrors(['to_unit_id' => 'Unit tujuan tidak boleh sama dengan unit Anda.']);
            }
        }

        if ($movementType === 'Pindah Lokasi') {
            $fromLocationId = (int) ($data['from_location_id'] ?? 0);
            $toLocationId = (int) ($data['to_location_id'] ?? 0);
            $assetUnitId = (int) (AsetInventaris::whereKey($data['asset_id'])->value('unit_id') ?? 0);

            if ($fromLocationId > 0 && $toLocationId > 0 && $fromLocationId === $toLocationId) {
                return back()->withErrors(['to_location_id' => 'Lokasi tujuan tidak boleh sama dengan lokasi asal.']);
            }
            if ($assetUnitId > 0 && Location::whereKey($fromLocationId)->where('unit_id', $assetUnitId)->doesntExist()) {
                return back()->withErrors(['from_location_id' => 'Lokasi asal harus dimiliki unit aset.']);
            }
            if ($assetUnitId > 0 && Location::whereKey($toLocationId)->where('unit_id', $assetUnitId)->doesntExist()) {
                return back()->withErrors(['to_location_id' => 'Lokasi tujuan harus dimiliki unit aset.']);
            }
        }

        if ($movementType === 'Pindah Ruangan') {
            $fromRoomId = (int) ($data['from_room_id'] ?? 0);
            $toRoomId = (int) ($data['to_room_id'] ?? 0);
            $assetUnitId = (int) (AsetInventaris::whereKey($data['asset_id'])->value('unit_id') ?? 0);

            if ($fromRoomId > 0 && $toRoomId > 0 && $fromRoomId === $toRoomId) {
                return back()->withErrors(['to_room_id' => 'Ruangan tujuan tidak boleh sama dengan ruangan asal.']);
            }
            if ($assetUnitId > 0 && Room::whereKey($fromRoomId)->where('unit_id', $assetUnitId)->doesntExist()) {
                return back()->withErrors(['from_room_id' => 'Ruangan asal harus dimiliki unit aset.']);
            }
            if ($assetUnitId > 0 && Room::whereKey($toRoomId)->where('unit_id', $assetUnitId)->doesntExist()) {
                return back()->withErrors(['to_room_id' => 'Ruangan tujuan harus dimiliki unit aset.']);
            }
            if (Room::whereKey($toRoomId)->where('status', 'aktif')->doesntExist()) {
                return back()->withErrors(['to_room_id' => 'Ruangan tujuan sedang penuh atau tidak aktif. Pilih ruangan aktif.']);
            }
        }

        $assetMutation->update([
            'asset_id' => $data['asset_id'],
            'from_unit_id' => $data['from_unit_id'] ?? null,
            'to_unit_id' => $data['to_unit_id'] ?? null,
            'from_location_id' => $data['from_location_id'] ?? null,
            'to_location_id' => $data['to_location_id'] ?? null,
            'from_room_id' => $data['from_room_id'] ?? null,
            'to_room_id' => $data['to_room_id'] ?? null,
            'movement_type' => $data['movement_type'],
            'reference_number' => $data['reference_number'] ?? null,
            'mutation_date' => $data['mutation_date'],
            'notes' => $data['notes'] ?? null,
            'status' => $data['status'],
        ]);
        $this->logActivity(
            'update',
            'Memperbarui mutasi aset #' . $assetMutation->id . '.',
            AssetMutation::class,
            (int) $assetMutation->id,
        );

        return redirect('/mutasi')->with('success', 'Mutasi aset berhasil diperbarui.');
    }

    public function approveMutation(AssetMutation $assetMutation)
    {
        $user = auth()->user();
        $currentUnitId = $user && $user->hasRole('admin_unit') ? (int) ($user->unit_id ?? 0) : 0;

        if (!$user || !$user->hasRole('admin_unit') || $currentUnitId !== (int) ($assetMutation->to_unit_id ?? 0)) {
            abort(403, 'Hanya unit tujuan yang dapat menyetujui mutasi ini.');
        }

        if (($assetMutation->status ?? 'proses') !== 'proses') {
            return back()->withErrors(['status' => 'Mutasi ini sudah diproses sebelumnya.']);
        }

        if (($assetMutation->movement_type ?? '') !== 'Pemindahan Unit') {
            return back()->withErrors(['movement_type' => 'Hanya mutasi unit yang memerlukan persetujuan unit tujuan.']);
        }

        $assetMutation->update([
            'status' => 'sukses',
            'notes' => trim(($assetMutation->notes ?? '') . "\nDisetujui oleh unit tujuan " . ($user->unit?->name ?? 'Tujuan')),
        ]);
        $this->logActivity(
            'approval',
            'Menyetujui mutasi aset "' . ($assetMutation->asset?->nama_aset ?? 'Aset') . '" oleh unit tujuan.',
            AssetMutation::class,
            (int) $assetMutation->id,
        );

        $this->applyMutationAssetTransfer($assetMutation);

        return redirect('/mutasi')->with('success', 'Mutasi aset disetujui dan aset sudah berpindah ke unit tujuan.');
    }

    public function rejectMutation(AssetMutation $assetMutation)
    {
        $user = auth()->user();
        $currentUnitId = $user && $user->hasRole('admin_unit') ? (int) ($user->unit_id ?? 0) : 0;

        if (!$user || !$user->hasRole('admin_unit') || $currentUnitId !== (int) ($assetMutation->to_unit_id ?? 0)) {
            abort(403, 'Hanya unit tujuan yang dapat menolak mutasi ini.');
        }

        if (($assetMutation->status ?? 'proses') !== 'proses') {
            return back()->withErrors(['status' => 'Mutasi ini sudah tidak dalam tahap persetujuan.']);
        }

        $assetMutation->update([
            'status' => 'gagal',
            'notes' => trim(($assetMutation->notes ?? '') . "\nDitolak oleh unit tujuan " . ($user->unit?->name ?? 'Tujuan')),
        ]);
        $this->logActivity(
            'rejection',
            'Menolak mutasi aset "' . ($assetMutation->asset?->nama_aset ?? 'Aset') . '" oleh unit tujuan.',
            AssetMutation::class,
            (int) $assetMutation->id,
        );

        return redirect('/mutasi')->with('success', 'Mutasi aset ditolak oleh unit tujuan.');
    }

    public function destroy(AssetMutation $assetMutation)
    {
        $assetName = $assetMutation->asset?->nama_aset ?? 'Aset';
        $assetMutation->delete();
        $this->logActivity('delete', 'Menghapus mutasi aset "' . $assetName . '".', AssetMutation::class, (int) $assetMutation->id);

        return redirect('/mutasi')->with('success', 'Mutasi aset berhasil dihapus.');
    }

    public function borrowings()
    {
        $user = auth()->user();
        $query = AssetBorrowing::with(['asset.unit', 'borrowerUnit'])->latest();
        if ($user && $user->hasRole('admin_unit')) {
            $query->where('borrower_unit_id', $user->unit_id);
        }

        $rows = $query->get()->map(fn ($item, $index) => [
            'id' => (string) $item->id,
            'no' => $index + 1,
            'namaAset' => $item->asset?->nama_aset ?? $item->asset?->name ?? '-',
            'jumlah' => (int) ($item->quantity ?? 1),
            'peminjam' => $item->borrower_name ?? $item->borrower_names ?? '-',
            'unit' => $item->borrowerUnit?->name ?? '-',
            'unitDiPinjam' => $item->asset?->unit?->name ?? '-',
            'tanggalPinjam' => $item->loan_date?->format('Y-m-d') ?? '-',
            'tanggalJatuhTempo' => $item->due_date?->format('Y-m-d') ?? '-',
            'tanggalKembali' => $item->return_date?->format('Y-m-d') ?? '-',
            'status' => match ($item->status) {
                'pending' => 'Pending',
                'dipinjam' => 'Dipinjam',
                'pengembalian' => 'Menunggu Pengembalian',
                'dikembalikan' => 'Selesai',
                'ditolak' => 'Ditolak',
                default => ucfirst((string) $item->status),
            },
        ]);

        return Inertia::render('Transactions/Peminjaman', ['rows' => $rows]);
    }

    public function showBorrowing(AssetBorrowing $assetBorrowing)
    {
        $assetBorrowing->load(['asset', 'borrowerUnit']);

        $statusLabel = match ($assetBorrowing->status) {
            'pending' => 'Pending',
            'dipinjam' => 'Dipinjam',
            'pengembalian' => 'Menunggu Pengembalian',
            'dikembalikan' => 'Selesai',
            'ditolak' => 'Ditolak',
            default => ucfirst((string) $assetBorrowing->status),
        };

        if ($assetBorrowing->return_date && $statusLabel === 'Dipinjam') {
            $statusLabel = 'Selesai';
        }

        return Inertia::render('Transactions/Peminjaman/Show', [
            'borrowing' => [
                'id' => (string) $assetBorrowing->id,
                'asset_id' => (string) $assetBorrowing->asset_id,
                'asset_name' => $assetBorrowing->asset?->nama_aset ?? $assetBorrowing->asset?->name ?? '-',
                'asset_code' => $assetBorrowing->asset?->kode_aset ?? $assetBorrowing->asset?->asset_code ?? '-',
                'quantity' => (int) ($assetBorrowing->quantity ?? 1),
                'borrower_name' => $assetBorrowing->borrower_name ?? $assetBorrowing->borrower_names ?? '-',
                'borrower_names' => $assetBorrowing->borrower_names ?? $assetBorrowing->borrower_name ?? '-',
                'borrower_unit' => $assetBorrowing->borrowerUnit?->name ?? '-',
                'loan_date' => $assetBorrowing->loan_date?->format('Y-m-d') ?? '-',
                'due_date' => $assetBorrowing->due_date?->format('Y-m-d') ?? '-',
                'return_date' => $assetBorrowing->return_date?->format('Y-m-d') ?? '-',
                'purpose' => $assetBorrowing->purpose ?? '-',
                'notes' => $assetBorrowing->notes ?? '-',
                'status' => $assetBorrowing->status ?? 'dipinjam',
                'status_label' => $statusLabel,
                'created_at' => $assetBorrowing->created_at?->format('Y-m-d H:i:s') ?? '-',
                'updated_at' => $assetBorrowing->updated_at?->format('Y-m-d H:i:s') ?? '-',
            ],
        ]);
    }

    public function createBorrowing()
    {
        $user = auth()->user();
        $currentUnitId = $user && $user->hasRole('admin_unit') ? (string) ($user->unit_id ?? '') : null;

        $assetQuery = AsetInventaris::with('unit')->orderBy('nama_aset');
        $assets = $assetQuery->get()->map(function ($item) {
            $total = (int) ($item->jumlah ?? 0);
            $borrowed = (int) AssetBorrowing::where('asset_id', $item->id)
                ->whereIn('status', ['pending', 'dipinjam', 'pengembalian'])
                ->sum('quantity');

            return [
                'id' => (string) $item->id,
                'name' => $item->nama_aset,
                'kode' => $item->kode_aset,
                'unit_id' => $item->unit_id ? (string) $item->unit_id : null,
                'unit_name' => $item->unit?->name ?? '-',
                'jumlah' => $total,
                'available' => max(0, $total - $borrowed),
                'available_quantity' => max(0, $total - $borrowed),
            ];
        });

        $units = Unit::orderBy('name')->get()->map(fn ($item) => [
            'id' => (string) $item->id,
            'name' => $item->name,
        ]);

        return Inertia::render('Transactions/Peminjaman/Create', ['assets' => $assets, 'units' => $units, 'current_unit_id' => $currentUnitId]);
    }

    public function storeBorrowing(Request $request)
    {
        $user = auth()->user();
        $currentUnitId = $user && $user->hasRole('admin_unit') ? (int) ($user->unit_id ?? 0) : null;

        $data = $request->validate([
            'asset_id' => ['required', 'integer', 'exists:aset_inventaris,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'borrower_unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'borrower_name' => ['required', 'string', 'max:255'],
            'borrower_names' => ['nullable', 'string', 'max:255'],
            'loan_date' => ['required', 'date'],
            'loan_time' => ['nullable', 'date_format:H:i'],
            'due_date' => ['nullable', 'date', 'after_or_equal:loan_date'],
            'due_time' => ['nullable', 'date_format:H:i'],
            'return_date' => ['nullable', 'date', 'after_or_equal:loan_date'],
            'return_time' => ['nullable', 'date_format:H:i'],
            'purpose' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:pending,dipinjam,pengembalian,dikembalikan,ditolak'],
        ]);

        $asset = AsetInventaris::with('unit')->findOrFail($data['asset_id']);
        if ($currentUnitId) {
            $data['borrower_unit_id'] = $currentUnitId;
        }

        $requestedQuantity = (int) $data['quantity'];
        $availableQuantity = (int) ($asset->jumlah ?? 0);
        $borrowedQuantity = (int) AssetBorrowing::where('asset_id', $asset->id)
            ->whereIn('status', ['pending', 'dipinjam', 'pengembalian'])
            ->sum('quantity');

        if ($requestedQuantity > ($availableQuantity - $borrowedQuantity)) {
            return back()->withErrors([
                'quantity' => 'Jumlah pinjam melebihi ketersediaan aset. Saat ini tersedia ' . max(0, $availableQuantity - $borrowedQuantity) . ' unit untuk aset ini.',
            ])->withInput();
        }

        $borrowing = AssetBorrowing::create([
            'asset_id' => $data['asset_id'],
            'quantity' => $requestedQuantity,
            'borrower_unit_id' => $data['borrower_unit_id'] ?? null,
            'borrower_name' => $data['borrower_name'],
            'borrower_names' => $data['borrower_names'] ?? $data['borrower_name'],
            'loan_date' => $data['loan_date'],
            'loan_time' => $data['loan_time'] ?? null,
            'due_date' => $data['due_date'] ?? null,
            'due_time' => $data['due_time'] ?? null,
            'return_date' => $data['return_date'] ?? null,
            'return_time' => $data['return_time'] ?? null,
            'purpose' => $data['purpose'] ?? null,
            'notes' => $data['notes'] ?? null,
            'status' => $data['status'] ?? 'dipinjam',
        ]);
        $this->logActivity(
            'request',
            'Mengajukan peminjaman aset "' . ($asset->nama_aset ?? 'Aset') . '" oleh ' . $data['borrower_name'] . '.',
            AssetBorrowing::class,
            (int) $borrowing->id,
        );

        return redirect('/peminjaman')->with('success', 'Peminjaman aset berhasil ditambahkan.');
    }

    public function editBorrowing(AssetBorrowing $assetBorrowing)
    {
        $user = auth()->user();
        $currentUnitId = $user && $user->hasRole('admin_unit') ? (string) ($user->unit_id ?? '') : null;

        $assetQuery = AsetInventaris::with('unit')->orderBy('nama_aset');
        $assets = $assetQuery->get()->map(function ($item) {
            $total = (int) ($item->jumlah ?? 0);
            $borrowed = (int) AssetBorrowing::where('asset_id', $item->id)
                ->whereIn('status', ['pending', 'dipinjam', 'pengembalian'])
                ->sum('quantity');

            return [
                'id' => (string) $item->id,
                'name' => $item->nama_aset,
                'kode' => $item->kode_aset,
                'unit_id' => $item->unit_id ? (string) $item->unit_id : null,
                'unit_name' => $item->unit?->name ?? '-',
                'jumlah' => $total,
                'available' => max(0, $total - $borrowed),
                'available_quantity' => max(0, $total - $borrowed),
            ];
        });

        $units = Unit::orderBy('name')->get()->map(fn ($item) => [
            'id' => (string) $item->id,
            'name' => $item->name,
        ]);

        return Inertia::render('Transactions/Peminjaman/Edit', [
            'borrowing' => [
                'id' => (string) $assetBorrowing->id,
                'asset_id' => (string) $assetBorrowing->asset_id,
                'quantity' => (string) ($assetBorrowing->quantity ?? 1),
                'borrower_unit_id' => $assetBorrowing->borrower_unit_id ? (string) $assetBorrowing->borrower_unit_id : '',
                'borrower_name' => $assetBorrowing->borrower_name ?? '',
                'borrower_names' => $assetBorrowing->borrower_names ?? ($assetBorrowing->borrower_name ?? ''),
                'loan_date' => $assetBorrowing->loan_date?->format('Y-m-d') ?? '',
                'loan_time' => $assetBorrowing->loan_time ? substr((string) $assetBorrowing->loan_time, 0, 5) : '',
                'due_date' => $assetBorrowing->due_date?->format('Y-m-d') ?? '',
                'due_time' => $assetBorrowing->due_time ? substr((string) $assetBorrowing->due_time, 0, 5) : '',
                'return_date' => $assetBorrowing->return_date?->format('Y-m-d') ?? '',
                'return_time' => $assetBorrowing->return_time ? substr((string) $assetBorrowing->return_time, 0, 5) : '',
                'purpose' => $assetBorrowing->purpose ?? '',
                'notes' => $assetBorrowing->notes ?? '',
                'status' => $assetBorrowing->status ?? 'dipinjam',
            ],
            'assets' => $assets,
            'units' => $units,
            'current_unit_id' => $currentUnitId,
        ]);
    }

    public function updateBorrowing(Request $request, AssetBorrowing $assetBorrowing)
    {
        $user = auth()->user();
        $currentUnitId = $user && $user->hasRole('admin_unit') ? (int) ($user->unit_id ?? 0) : null;

        $data = $request->validate([
            'asset_id' => ['required', 'integer', 'exists:aset_inventaris,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'borrower_unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'borrower_name' => ['required', 'string', 'max:255'],
            'borrower_names' => ['nullable', 'string', 'max:255'],
            'loan_date' => ['required', 'date'],
            'loan_time' => ['nullable', 'date_format:H:i'],
            'due_date' => ['nullable', 'date', 'after_or_equal:loan_date'],
            'due_time' => ['nullable', 'date_format:H:i'],
            'return_date' => ['nullable', 'date', 'after_or_equal:loan_date'],
            'return_time' => ['nullable', 'date_format:H:i'],
            'purpose' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:pending,dipinjam,pengembalian,dikembalikan,ditolak'],
        ]);

        $asset = AsetInventaris::with('unit')->findOrFail($data['asset_id']);
        if ($currentUnitId) {
            $data['borrower_unit_id'] = $currentUnitId;
        }

        $requestedQuantity = (int) $data['quantity'];
        $availableQuantity = (int) ($asset->jumlah ?? 0);
        $borrowedQuantity = (int) AssetBorrowing::where('asset_id', $asset->id)
            ->where('id', '!=', $assetBorrowing->id)
            ->whereIn('status', ['pending', 'dipinjam', 'pengembalian'])
            ->sum('quantity');

        if ($requestedQuantity > ($availableQuantity - $borrowedQuantity + (int) $assetBorrowing->quantity)) {
            return back()->withErrors([
                'quantity' => 'Jumlah pinjam melebihi ketersediaan aset. Saat ini tersedia ' . max(0, $availableQuantity - $borrowedQuantity + (int) $assetBorrowing->quantity) . ' unit untuk aset ini.',
            ])->withInput();
        }

        $assetBorrowing->update([
            'asset_id' => $data['asset_id'],
            'quantity' => $requestedQuantity,
            'borrower_unit_id' => $data['borrower_unit_id'] ?? null,
            'borrower_name' => $data['borrower_name'],
            'borrower_names' => $data['borrower_names'] ?? $data['borrower_name'],
            'loan_date' => $data['loan_date'],
            'loan_time' => $data['loan_time'] ?? null,
            'due_date' => $data['due_date'] ?? null,
            'due_time' => $data['due_time'] ?? null,
            'return_date' => $data['return_date'] ?? null,
            'return_time' => $data['return_time'] ?? null,
            'purpose' => $data['purpose'] ?? null,
            'notes' => $data['notes'] ?? null,
            'status' => $data['status'] ?? $assetBorrowing->status,
        ]);
        $this->logActivity(
            'update',
            'Memperbarui peminjaman aset #' . $assetBorrowing->id . '.',
            AssetBorrowing::class,
            (int) $assetBorrowing->id,
        );

        return redirect('/peminjaman')->with('success', 'Peminjaman aset berhasil diperbarui.');
    }

    public function destroyBorrowing(AssetBorrowing $assetBorrowing)
    {
        $assetName = $assetBorrowing->asset?->nama_aset ?? 'Aset';
        $assetBorrowing->delete();
        $this->logActivity('delete', 'Menghapus peminjaman aset "' . $assetName . '".', AssetBorrowing::class, (int) $assetBorrowing->id);

        return redirect('/peminjaman')->with('success', 'Peminjaman aset berhasil dihapus.');
    }

    public function requestReturnBorrowing(AssetBorrowing $assetBorrowing)
    {
        if ($assetBorrowing->status === 'pengembalian') {
            return redirect('/peminjaman')->with('success', 'Permintaan pengembalian sudah dikirim sebelumnya.');
        }

        $assetBorrowing->update([
            'status' => 'pengembalian',
            'return_date' => now()->toDateString(),
        ]);
        $this->logActivity(
            'request',
            'Mengajukan pengembalian aset "' . ($assetBorrowing->asset?->nama_aset ?? 'Aset') . '".',
            AssetBorrowing::class,
            (int) $assetBorrowing->id,
        );

        return redirect('/peminjaman')->with('success', 'Permintaan pengembalian aset telah dikirim ke unit pemilik aset.');
    }

    public function approveBorrowing(AssetBorrowing $assetBorrowing)
    {
        $user = auth()->user();
        if ($user && $user->hasRole('admin_unit')) {
            abort_unless($assetBorrowing->asset?->unit_id === $user->unit_id, 403);
        }

        $nextStatus = $assetBorrowing->status === 'pengembalian' ? 'dikembalikan' : 'dipinjam';
        $assetBorrowing->update([
            'status' => $nextStatus,
            'return_date' => $nextStatus === 'dikembalikan' ? ($assetBorrowing->return_date ?? now()->toDateString()) : $assetBorrowing->return_date,
        ]);
        $this->logActivity(
            'approval',
            'Menyetujui permintaan peminjaman/pengembalian aset #' . $assetBorrowing->id . '.',
            AssetBorrowing::class,
            (int) $assetBorrowing->id,
        );

        return redirect('/pengembalian')->with('success', 'Permintaan berhasil disetujui.');
    }

    public function rejectBorrowing(AssetBorrowing $assetBorrowing)
    {
        $user = auth()->user();
        if ($user && $user->hasRole('admin_unit')) {
            abort_unless($assetBorrowing->asset?->unit_id === $user->unit_id, 403);
        }

        $nextStatus = $assetBorrowing->status === 'pengembalian' ? 'dipinjam' : 'ditolak';
        $assetBorrowing->update(['status' => $nextStatus]);
        $this->logActivity(
            'rejection',
            'Menolak permintaan peminjaman/pengembalian aset "' . ($assetBorrowing->asset?->nama_aset ?? 'Aset') . '".',
            AssetBorrowing::class,
            (int) $assetBorrowing->id,
        );

        return redirect('/pengembalian')->with('success', 'Permintaan berhasil ditolak.');
    }

    public function returns()
    {
        $user = auth()->user();
        $query = AssetBorrowing::with(['asset.unit', 'borrowerUnit'])
            ->whereIn('status', ['pending', 'dipinjam', 'pengembalian', 'dikembalikan', 'ditolak'])
            ->latest();

        if ($user && $user->hasRole('admin_unit')) {
            $query->whereHas('asset', function ($assetQuery) use ($user) {
                $assetQuery->where('unit_id', $user->unit_id);
            })->where(function ($borrowerQuery) use ($user) {
                $borrowerQuery
                    ->whereNull('borrower_unit_id')
                    ->orWhere('borrower_unit_id', '!=', $user->unit_id);
            });
        }

        $rows = $query->get()->map(fn ($item, $index) => [
            'id' => (string) $item->id,
            'no' => $index + 1,
            'namaAset' => $item->asset?->nama_aset ?? $item->asset?->name ?? '-',
            'peminjam' => $item->borrower_name ?? $item->borrower_names ?? '-',
            'unit' => $item->borrowerUnit?->name ?? '-',
            'unitPeminjam' => $item->borrowerUnit?->name ?? '-',
            'unitPemilik' => $item->asset?->unit?->name ?? '-',
            'unitDiPinjam' => $item->borrowerUnit?->name ?? '-',
            'tanggalPinjam' => $item->loan_date?->format('Y-m-d') ?? '-',
            'tanggalJatuhTempo' => $item->due_date?->format('Y-m-d') ?? '-',
            'tanggalKembali' => $item->return_date?->format('Y-m-d') ?? '-',
            'status' => match ($item->status) {
                'pending' => 'Menunggu Persetujuan',
                'dipinjam' => 'Dipinjam',
                'pengembalian' => 'Menunggu Persetujuan',
                'dikembalikan' => 'Selesai',
                'ditolak' => 'Ditolak',
                default => ucfirst((string) $item->status),
            },
            'statusRaw' => $item->status ?? 'pending',
        ]);

        return Inertia::render('Transactions/Pengembalian', ['rows' => $rows]);
    }
}
