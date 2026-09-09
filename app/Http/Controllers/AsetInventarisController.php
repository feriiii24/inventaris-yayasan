<?php

namespace App\Http\Controllers;

use App\Models\AsetInventaris;
use App\Models\AssetBorrowing;
use App\Models\Location;
use App\Models\Room;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AsetInventarisController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            $user = auth()->user();

            if ($user && $user->hasRole('admin_unit')) {
                // only enforce for routes that have asetInventaris route-model binding
                $routeAset = $request->route('asetInventaris') ?? null;
                if ($routeAset) {
                    $aset = $routeAset instanceof AsetInventaris ? $routeAset : AsetInventaris::find($routeAset);
                    if ($aset && ($aset->unit_id ?? null) !== ($user->unit_id ?? null)) {
                        abort(403);
                    }
                }
            }

            return $next($request);
        })->only(['show', 'edit', 'update', 'destroy']);
    }

    public function index()
    {
        $query = AsetInventaris::query()->with(['lokasi', 'unit', 'room'])->latest('created_at');
        $this->applyUnitFilter($query);

        $totalRows = (clone $query)->count();
        $totalUnits = (clone $query)->sum('jumlah');
        $rows = $query->limit(1000)->get()->map(function (AsetInventaris $aset, int $index) {
            $tanggalPembukuan = $aset->tanggal_pembukuan ? $aset->tanggal_pembukuan->format('Y-m-d') : $aset->created_at?->format('Y-m-d');

            return [
                'id' => (string) $aset->id,
                'no' => $index + 1,
                'tanggalPembukuan' => $tanggalPembukuan,
                'tanggal_pembukuan' => $tanggalPembukuan,
                'kode' => $aset->kode_aset,
                'kodeAset' => $aset->kode_aset,
                'nama' => $aset->nama_aset,
                'namaAset' => $aset->nama_aset,
                'spesifikasi' => $aset->spesifikasi,
                'jumlah' => (int) $aset->jumlah,
               'jumlahBaik' => (int) ($aset->jumlah_baik ?? 0),
               'jumlahRusakRingan' => (int) ($aset->jumlah_rusak_ringan ?? 0),
               'jumlahRusakBerat' => (int) ($aset->jumlah_rusak_berat ?? 0),
               'jumlahDalamPerbaikan' => (int) ($aset->jumlah_dalam_perbaikan ?? 0),
               'satuan' => $aset->satuan,
               'asalBarang' => $aset->asal_barang,
               'tahunPengadaan' => $aset->tahun_pengadaan,
               'hargaPerolehan' => $aset->harga_perolehan,
               'harga' => $aset->harga_perolehan,
               'kondisi' => $aset->kondisi,
               'lokasi' => $aset->lokasi?->name ?? '-',
               'lokasiId' => $aset->lokasi_id,
               'unit' => $aset->unit?->name ?? '-',
               'unitId' => $aset->unit_id,
               'ruangan' => $aset->room?->name ?? '-',
               'roomId' => $aset->room_id,
               'deskripsi' => $aset->deskripsi,
               'gambar' => $aset->gambar,
               'gambar_url' => $this->asPublicUrl($aset->gambar),
               'dokumen' => $aset->dokumen,
               'dokumen_url' => $this->asPublicUrl($aset->dokumen),
               'created_at' => $aset->created_at?->format('Y-m-d'),
               'updated_at' => $aset->updated_at?->format('Y-m-d'),
               'dibuat' => $tanggalPembukuan,
            ];
        });

        return Inertia::render('Assets/Inventaris', [
            'rows' => $rows,
            'totalRows' => $totalRows,
            'totalUnits' => (int) $totalUnits,
        ]);
    }

    public function publicIndex()
    {
        return Inertia::render('Public/Inventory', ['publicAssets' => $this->publicAssets()]);
    }

    public function publicBorrowing()
    {
        return Inertia::render('Public/Borrowing', ['publicAssets' => $this->publicAssets()]);
    }

    public function storePublicBorrowing(Request $request)
    {
        $data = $request->validate([
            'asset_id' => ['required', 'integer', 'exists:aset_inventaris,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'borrower_name' => ['required', 'string', 'max:255'],
            'borrower_names' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'purpose' => ['required', 'string', 'max:255'],
            'loan_date' => ['required', 'date'],
            'loan_time' => ['required', 'date_format:H:i'],
            'due_date' => ['required', 'date', 'after_or_equal:loan_date'],
            'due_time' => ['required', 'date_format:H:i'],
            'return_date' => ['required', 'date', 'after_or_equal:loan_date'],
            'return_time' => ['required', 'date_format:H:i'],
            'notes' => ['nullable', 'string'],
        ]);

        $asset = AsetInventaris::findOrFail($data['asset_id']);
        $borrowedQuantity = AssetBorrowing::query()
            ->where('asset_id', $asset->id)
            ->whereIn('status', ['pending', 'dipinjam', 'pengembalian'])
            ->sum('quantity');
        $unavailableConditionQuantity = (int) ($asset->jumlah_rusak_berat ?? 0) + (int) ($asset->jumlah_dalam_perbaikan ?? 0);
        $availableQuantity = max(0, (int) $asset->jumlah - $unavailableConditionQuantity - (int) $borrowedQuantity);

        if ($unavailableConditionQuantity > 0 || $borrowedQuantity > 0 || (int) $data['quantity'] > $availableQuantity) {
            return back()->withErrors([
                'quantity' => $borrowedQuantity > 0
                    ? 'Aset sedang dipinjam dan belum dapat diajukan kembali.'
                    : ($unavailableConditionQuantity > 0
                        ? 'Aset rusak berat atau sedang dalam perbaikan sehingga tidak dapat dipinjam.'
                        : 'Jumlah pinjam melebihi stok tersedia. Saat ini tersedia ' . $availableQuantity . ' unit.'),
            ])->withInput();
        }

        AssetBorrowing::create([
            'asset_id' => $asset->id,
            'quantity' => $data['quantity'],
            'borrower_name' => $data['borrower_name'],
            'borrower_names' => $data['borrower_names'] ?? $data['borrower_name'],
            'purpose' => $data['purpose'],
            'loan_date' => $data['loan_date'],
            'loan_time' => $data['loan_time'],
            'due_date' => $data['due_date'] ?? null,
            'due_time' => $data['due_time'] ?? null,
            'return_date' => $data['return_date'] ?? null,
            'return_time' => $data['return_time'] ?? null,
            'notes' => "Kontak: {$data['phone']}" . (!empty($data['notes']) ? "\n{$data['notes']}" : ''),
            'status' => 'pending',
        ]);

        return redirect()->route('assets.public.borrowing', ['submitted' => 1]);
    }

    private function publicAssets()
    {
        $inventory = AsetInventaris::query()
            ->with(['lokasi', 'unit', 'room'])
            ->latest('created_at')
            ->get();
        $borrowedQuantities = AssetBorrowing::query()
            ->whereIn('asset_id', $inventory->pluck('id'))
            ->whereIn('status', ['pending', 'dipinjam', 'pengembalian'])
            ->groupBy('asset_id')
            ->selectRaw('asset_id, SUM(quantity) as total')
            ->pluck('total', 'asset_id');

        $assets = $inventory->map(function (AsetInventaris $aset) use ($borrowedQuantities) {
            $damagedQuantity = (int) ($aset->jumlah_rusak_berat ?? 0);
            $repairQuantity = (int) ($aset->jumlah_dalam_perbaikan ?? 0);
            $borrowedQuantity = (int) ($borrowedQuantities[$aset->id] ?? 0);
            $availableQuantity = max(0, (int) $aset->jumlah - $damagedQuantity - $repairQuantity - $borrowedQuantity);
            $status = $damagedQuantity > 0
                ? 'Rusak Berat'
                : ($repairQuantity > 0
                    ? 'Dalam Perbaikan'
                    : ($borrowedQuantity > 0 ? 'Sedang Dipinjam' : ($availableQuantity > 0 ? 'Bisa dipinjam' : 'Tidak bisa dipinjam')));

            return [
                'id' => (string) $aset->id,
                'kode' => $aset->kode_aset,
                'nama' => $aset->nama_aset,
                'kategori' => 'Inventaris',
                'jenis' => $aset->spesifikasi ?: 'Aset inventaris',
                'lokasi' => $aset->lokasi?->name ?? '-',
                'unit' => $aset->unit?->name ?? '-',
                'ruangan' => $aset->room?->name ?? '-',
                'jumlah' => (int) $aset->jumlah,
                'satuan' => $aset->satuan ?? 'Unit',
                'kondisi' => $aset->kondisi ?? 'Baik',
                'jumlahRusakBerat' => $damagedQuantity,
                'jumlahDalamPerbaikan' => $repairQuantity,
                'jumlahDipinjam' => $borrowedQuantity,
                'jumlahTersedia' => $availableQuantity,
                'status' => $status,
            ];
        });

        return $assets;
    }

    public function create()
    {
        $user = auth()->user();

        // include unit_id so frontend can filter locations/rooms by selected unit
        $locationsQuery = Location::query()->select(['id', 'name', 'unit_id'])->orderBy('name');
        $this->applyUnitFilter($locationsQuery);
        $locations = $locationsQuery->get()->toArray();

        $unitsQuery = Unit::query()->select(['id', 'name'])->orderBy('name');
        if ($user && $user->hasRole('admin_unit')) {
            $unitsQuery->where('id', $user->unit_id);
        }
        $units = $unitsQuery->get()->toArray();

        $roomsQuery = Room::query()->select(['id', 'name', 'unit_id', 'location_id'])->orderBy('name');
        $this->applyUnitFilter($roomsQuery);
        $rooms = $roomsQuery->limit(1000)->get()->toArray();

        return Inertia::render('Inventaris/Create', [
            'locations' => $locations,
            'units' => $units,
            'rooms' => $rooms,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_aset' => ['required', 'string', 'max:255'],
            'tanggal_pembukuan' => ['nullable', 'date'],
            'nama_aset' => ['required', 'string', 'max:255'],
            'spesifikasi' => ['nullable', 'string'],
            'jumlah' => ['nullable', 'integer', 'min:0'],
            'jumlah_baik' => ['nullable', 'integer', 'min:0'],
            'jumlah_rusak_ringan' => ['nullable', 'integer', 'min:0'],
            'jumlah_rusak_berat' => ['nullable', 'integer', 'min:0'],
            'jumlah_dalam_perbaikan' => ['nullable', 'integer', 'min:0'],
            'satuan' => ['nullable', 'string', 'max:50'],
            'asal_barang' => ['nullable', 'string', 'max:255'],
            'tahun_pengadaan' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'harga_perolehan' => ['nullable', 'numeric', 'min:0'],
            'kondisi' => ['nullable', 'in:Baik,Rusak Ringan,Rusak Berat,Dalam Perbaikan'],
            'lokasi_id' => ['nullable', 'integer'],
            'unit_id' => ['nullable', 'integer'],
            'room_id' => ['nullable', 'integer'],
            'deskripsi' => ['nullable', 'string'],
            'gambar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'dokumen' => ['nullable', 'file', 'mimetypes:application/pdf', 'max:10240'],
        ]);

        $total = (int) ($validated['jumlah'] ?? 0);
        $jumlahBaik = (int) ($validated['jumlah_baik'] ?? 0);
        $jumlahRusakRingan = (int) ($validated['jumlah_rusak_ringan'] ?? 0);
        $jumlahRusakBerat = (int) ($validated['jumlah_rusak_berat'] ?? 0);
        $jumlahDalamPerbaikan = (int) ($validated['jumlah_dalam_perbaikan'] ?? 0);

        if (($jumlahBaik + $jumlahRusakRingan + $jumlahRusakBerat + $jumlahDalamPerbaikan) !== $total) {
            throw ValidationException::withMessages([
                'jumlah' => ['Total jumlah harus sama dengan jumlah semua kondisi aset.'],
            ]);
        }

        if (! empty($validated['room_id'])) {
            $room = Room::query()->findOrFail($validated['room_id']);
            if (! empty($validated['lokasi_id']) && (int) $room->location_id !== (int) $validated['lokasi_id']) {
                throw ValidationException::withMessages([
                    'room_id' => ['Ruangan tidak berada di lokasi yang dipilih.'],
                ]);
            }
            if (! empty($validated['unit_id']) && (int) $room->unit_id !== (int) $validated['unit_id']) {
                throw ValidationException::withMessages([
                    'room_id' => ['Ruangan tidak berada di unit yang dipilih.'],
                ]);
            }
        }

        $aset = AsetInventaris::query()->create([
            'kode_aset' => $validated['kode_aset'],
            'tanggal_pembukuan' => $validated['tanggal_pembukuan'] ?? now()->toDateString(),
            'nama_aset' => $validated['nama_aset'],
            'spesifikasi' => $validated['spesifikasi'] ?? null,
            'jumlah' => $total,
            'jumlah_baik' => $jumlahBaik,
            'jumlah_rusak_ringan' => $jumlahRusakRingan,
            'jumlah_rusak_berat' => $jumlahRusakBerat,
            'jumlah_dalam_perbaikan' => $jumlahDalamPerbaikan,
            'satuan' => $validated['satuan'] ?? 'Unit',
            'asal_barang' => $validated['asal_barang'] ?? null,
            'tahun_pengadaan' => $validated['tahun_pengadaan'] ?? null,
            'harga_perolehan' => $validated['harga_perolehan'] ?? 0,
            'kondisi' => $this->determineKondisi($jumlahBaik, $jumlahRusakRingan, $jumlahRusakBerat, $jumlahDalamPerbaikan),
            'lokasi_id' => $validated['lokasi_id'] ?? null,
            'unit_id' => $validated['unit_id'] ?? null,
            'room_id' => $validated['room_id'] ?? null,
            'deskripsi' => $validated['deskripsi'] ?? null,
            'gambar' => $this->handleImageUpload($request->file('gambar')),
            'dokumen' => $this->handleDocumentUpload($request->file('dokumen')),
        ]);

        $this->logActivity('create', 'Menambah aset inventaris "' . $aset->nama_aset . '"', AsetInventaris::class, (int) $aset->id);

        return redirect()->route('aset-inventaris.index')->with('success', 'Aset inventaris berhasil ditambahkan.');
    }

    public function show(AsetInventaris $asetInventaris)
    {
        return Inertia::render('Inventaris/Detail', ['asetInventaris' => $this->serialize($asetInventaris->load(['lokasi', 'unit', 'room']))]);
    }

    public function edit(AsetInventaris $asetInventaris)
    {
        $user = auth()->user();
        // include unit_id so frontend can filter locations/rooms by selected unit
        $locationsQuery = Location::query()->select(['id', 'name', 'unit_id'])->orderBy('name');
        $this->applyUnitFilter($locationsQuery);
        $locations = $locationsQuery->get()->toArray();

        $unitsQuery = Unit::query()->select(['id', 'name'])->orderBy('name');
        if ($user && $user->hasRole('admin_unit')) {
            $unitsQuery->where('id', $user->unit_id);
        }
        $units = $unitsQuery->get()->toArray();

        $roomsQuery = Room::query()->select(['id', 'name', 'unit_id', 'location_id'])->orderBy('name');
        $this->applyUnitFilter($roomsQuery);
        $rooms = $roomsQuery->limit(1000)->get()->toArray();

        return Inertia::render('Inventaris/Edit', [
            'asetInventaris' => $this->serialize($asetInventaris->load(['lokasi', 'unit', 'room'])),
            'locations' => $locations,
            'units' => $units,
            'rooms' => $rooms,
        ]);
    }

    public function update(Request $request, AsetInventaris $asetInventaris)
    {
        $validated = $request->validate([
            'kode_aset' => ['required', 'string', 'max:255'],
            'tanggal_pembukuan' => ['nullable', 'date'],
            'nama_aset' => ['required', 'string', 'max:255'],
            'spesifikasi' => ['nullable', 'string'],
            'jumlah' => ['nullable', 'integer', 'min:0'],
            'jumlah_baik' => ['nullable', 'integer', 'min:0'],
            'jumlah_rusak_ringan' => ['nullable', 'integer', 'min:0'],
            'jumlah_rusak_berat' => ['nullable', 'integer', 'min:0'],
            'jumlah_dalam_perbaikan' => ['nullable', 'integer', 'min:0'],
            'satuan' => ['nullable', 'string', 'max:50'],
            'asal_barang' => ['nullable', 'string', 'max:255'],
            'tahun_pengadaan' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'harga_perolehan' => ['nullable', 'numeric', 'min:0'],
            'kondisi' => ['nullable', 'in:Baik,Rusak Ringan,Rusak Berat,Dalam Perbaikan'],
            'lokasi_id' => ['nullable', 'integer'],
            'unit_id' => ['nullable', 'integer'],
            'room_id' => ['nullable', 'integer'],
            'deskripsi' => ['nullable', 'string'],
            'gambar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'dokumen' => ['nullable', 'file', 'mimetypes:application/pdf', 'max:10240'],
        ]);

        $total = (int) ($validated['jumlah'] ?? $asetInventaris->jumlah ?? 0);
        $jumlahBaik = (int) ($validated['jumlah_baik'] ?? $asetInventaris->jumlah_baik ?? 0);
        $jumlahRusakRingan = (int) ($validated['jumlah_rusak_ringan'] ?? $asetInventaris->jumlah_rusak_ringan ?? 0);
        $jumlahRusakBerat = (int) ($validated['jumlah_rusak_berat'] ?? $asetInventaris->jumlah_rusak_berat ?? 0);
        $jumlahDalamPerbaikan = (int) ($validated['jumlah_dalam_perbaikan'] ?? $asetInventaris->jumlah_dalam_perbaikan ?? 0);

        if (($jumlahBaik + $jumlahRusakRingan + $jumlahRusakBerat + $jumlahDalamPerbaikan) !== $total) {
            throw ValidationException::withMessages([
                'jumlah' => ['Total jumlah harus sama dengan jumlah semua kondisi aset.'],
            ]);
        }

        $asetInventaris->fill([
            'kode_aset' => $validated['kode_aset'],
            'tanggal_pembukuan' => $validated['tanggal_pembukuan'] ?? $asetInventaris->tanggal_pembukuan ?? now()->toDateString(),
            'nama_aset' => $validated['nama_aset'],
            'spesifikasi' => $validated['spesifikasi'] ?? $asetInventaris->spesifikasi,
            'jumlah' => $total,
            'jumlah_baik' => $jumlahBaik,
            'jumlah_rusak_ringan' => $jumlahRusakRingan,
            'jumlah_rusak_berat' => $jumlahRusakBerat,
            'jumlah_dalam_perbaikan' => $jumlahDalamPerbaikan,
            'satuan' => $validated['satuan'] ?? $asetInventaris->satuan,
            'asal_barang' => $validated['asal_barang'] ?? $asetInventaris->asal_barang,
            'tahun_pengadaan' => $validated['tahun_pengadaan'] ?? $asetInventaris->tahun_pengadaan,
            'harga_perolehan' => $validated['harga_perolehan'] ?? $asetInventaris->harga_perolehan,
            'kondisi' => $this->determineKondisi($jumlahBaik, $jumlahRusakRingan, $jumlahRusakBerat, $jumlahDalamPerbaikan),
            'lokasi_id' => $validated['lokasi_id'] ?? $asetInventaris->lokasi_id,
            'unit_id' => $validated['unit_id'] ?? $asetInventaris->unit_id,
            'room_id' => $validated['room_id'] ?? $asetInventaris->room_id,
            'deskripsi' => $validated['deskripsi'] ?? $asetInventaris->deskripsi,
        ]);

        if ($request->hasFile('gambar')) {
            $this->deleteFileIfExists($asetInventaris->gambar);
            $asetInventaris->gambar = $this->handleImageUpload($request->file('gambar'));
        }

        if ($request->hasFile('dokumen')) {
            $this->deleteFileIfExists($asetInventaris->dokumen);
            $asetInventaris->dokumen = $this->handleDocumentUpload($request->file('dokumen'));
        }

        $asetInventaris->save();

        $this->logActivity('update', 'Memperbarui aset inventaris "' . $asetInventaris->nama_aset . '"', AsetInventaris::class, (int) $asetInventaris->id);

        return redirect()->route('aset-inventaris.index')->with('success', 'Aset inventaris berhasil diperbarui.');
    }

    public function destroy(AsetInventaris $asetInventaris)
    {
        $asetName = $asetInventaris->nama_aset;
        $this->deleteFileIfExists($asetInventaris->gambar);
        $this->deleteFileIfExists($asetInventaris->dokumen);
        $asetInventaris->delete();

        $this->logActivity('delete', 'Menghapus aset inventaris "' . $asetName . '"', AsetInventaris::class, (int) $asetInventaris->id);

        return redirect()->route('aset-inventaris.index')->with('success', 'Aset inventaris berhasil dihapus.');
    }

    public function repair(AsetInventaris $asetInventaris)
    {
        $user = auth()->user();
        if ($user && $user->hasRole('admin_unit') && (int) $asetInventaris->unit_id !== (int) $user->unit_id) {
            abort(403);
        }

        $rusakRingan = (int) ($asetInventaris->jumlah_rusak_ringan ?? 0);
        $rusakBerat = (int) ($asetInventaris->jumlah_rusak_berat ?? 0);
        if ($rusakRingan === 0 && $rusakBerat === 0) {
            return back()->withErrors(['kondisi' => 'Aset ini tidak memiliki jumlah rusak yang dapat diperbaiki.']);
        }

        $asetInventaris->update([
            'jumlah_rusak_ringan' => 0,
            'jumlah_rusak_berat' => 0,
            'jumlah_dalam_perbaikan' => (int) ($asetInventaris->jumlah_dalam_perbaikan ?? 0) + $rusakRingan + $rusakBerat,
            'kondisi' => 'Dalam Perbaikan',
        ]);

        $this->logActivity('update', 'Memulai perbaikan aset inventaris "' . $asetInventaris->nama_aset . '".', AsetInventaris::class, (int) $asetInventaris->id);

        return redirect()->route('aset-inventaris.index')->with('success', 'Aset berhasil dipindahkan ke status Dalam Perbaikan.');
    }

    private function serialize(AsetInventaris $aset): array
    {
        return [
            'id' => (string) $aset->id,
            'tanggal_pembukuan' => $aset->tanggal_pembukuan?->format('Y-m-d'),
            'tanggalPembukuan' => $aset->tanggal_pembukuan?->format('Y-m-d'),
            'kode_aset' => $aset->kode_aset,
            'kodeAset' => $aset->kode_aset,
            'nama_aset' => $aset->nama_aset,
            'namaAset' => $aset->nama_aset,
            'spesifikasi' => $aset->spesifikasi,
            'jumlah' => (int) $aset->jumlah,
            'jumlah_baik' => (int) ($aset->jumlah_baik ?? 0),
            'jumlahBaik' => (int) ($aset->jumlah_baik ?? 0),
            'jumlah_rusak_ringan' => (int) ($aset->jumlah_rusak_ringan ?? 0),
            'jumlahRusakRingan' => (int) ($aset->jumlah_rusak_ringan ?? 0),
            'jumlah_rusak_berat' => (int) ($aset->jumlah_rusak_berat ?? 0),
            'jumlahRusakBerat' => (int) ($aset->jumlah_rusak_berat ?? 0),
            'jumlah_dalam_perbaikan' => (int) ($aset->jumlah_dalam_perbaikan ?? 0),
            'jumlahDalamPerbaikan' => (int) ($aset->jumlah_dalam_perbaikan ?? 0),
            'satuan' => $aset->satuan,
            'asal_barang' => $aset->asal_barang,
            'asalBarang' => $aset->asal_barang,
            'tahun_pengadaan' => $aset->tahun_pengadaan,
            'tahunPengadaan' => $aset->tahun_pengadaan,
            'harga_perolehan' => $aset->harga_perolehan,
            'hargaPerolehan' => $aset->harga_perolehan,
            'kondisi' => $aset->kondisi,
            'lokasi_id' => $aset->lokasi_id,
            'lokasiId' => $aset->lokasi_id,
            'lokasi' => $aset->lokasi?->name ?? '-',
            'unit_id' => $aset->unit_id,
            'unitId' => $aset->unit_id,
            'unit' => $aset->unit?->name ?? '-',
            'room_id' => $aset->room_id,
            'roomId' => $aset->room_id,
            'ruangan' => $aset->room?->name ?? '-',
            'deskripsi' => $aset->deskripsi,
            'gambar' => $aset->gambar,
            'gambar_url' => $this->asPublicUrl($aset->gambar),
            'dokumen' => $aset->dokumen,
            'dokumen_url' => $this->asPublicUrl($aset->dokumen),
            'created_at' => $aset->created_at?->format('Y-m-d'),
            'updated_at' => $aset->updated_at?->format('Y-m-d'),
            'dibuat' => $aset->created_at?->format('Y-m-d'),
        ];
    }

    private function determineKondisi(int $jumlahBaik, int $jumlahRusakRingan, int $jumlahRusakBerat, int $jumlahDalamPerbaikan): string
    {
        if ($jumlahRusakBerat > 0) {
            return 'Rusak Berat';
        }

        if ($jumlahDalamPerbaikan > 0) {
            return 'Dalam Perbaikan';
        }

        if ($jumlahRusakRingan > 0) {
            return 'Rusak Ringan';
        }

        if ($jumlahBaik > 0) {
            return 'Baik';
        }

        return 'Baik';
    }

    private function handleImageUpload($file): ?string
    {
        if (!$file) {
            return null;
        }

        $path = $file->store('aset-inventaris/gambar', 'public');

        if (!is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                'gambar' => ['Gagal mengunggah gambar aset inventaris.'],
            ]);
        }

        return $path;
    }

    private function handleDocumentUpload($file): ?string
    {
        if (!$file) {
            return null;
        }

        $mime = $file->getMimeType();
        $ext = strtolower($file->getClientOriginalExtension());

        if (($mime !== 'application/pdf' && $ext !== 'pdf') || !$file->isValid()) {
            throw ValidationException::withMessages([
                'dokumen' => ['Format dokumen harus PDF.'],
            ]);
        }

        $path = $file->store('aset-inventaris/dokumen', 'public');

        if (!is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                'dokumen' => ['Gagal mengunggah dokumen aset inventaris.'],
            ]);
        }

        return $path;
    }

    private function deleteFileIfExists(?string $path): void
    {
        if (!$path) {
            return;
        }

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    private function asPublicUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        return Storage::disk('public')->url($path);
    }
}
