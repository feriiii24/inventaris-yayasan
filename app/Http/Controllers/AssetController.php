<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetCategory;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AssetController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            $user = auth()->user();

            if ($user && $user->hasRole('admin_unit')) {
                $routeAsset = $request->route('asset') ?? null;
                if ($routeAsset) {
                    $asset = $routeAsset instanceof Asset ? $routeAsset : Asset::find($routeAsset);
                    if ($asset && ($asset->unit_id ?? null) !== ($user->unit_id ?? null)) {
                        abort(403);
                    }
                }
            }

            return $next($request);
        })->only(['edit', 'update', 'destroy', 'show']);
    }

    private function categoryId(string $slug): int
    {
        return AssetCategory::query()->where('slug', $slug)->value('id') ?? abort(404);
    }

    private function serializeAsset(Asset $asset): array
    {
        $document = $asset->metadata['document'] ?? null;

        return [
            'id' => (string) $asset->id,
            'asset_code' => $asset->asset_code,
            'kode' => $asset->asset_code,
            'name' => $asset->name,
            'nama' => $asset->name,
            'description' => $asset->description,
            'spesifikasi' => $asset->description,
            'quantity' => $asset->quantity,
            'jumlah' => $asset->quantity,
            'unit_measure' => $asset->unit_measure,
            'satuan' => $asset->unit_measure,
            'acquisition_source' => $asset->acquisition_source,
            'asalBarang' => $asset->acquisition_source,
            'acquisition_year' => $asset->acquisition_year,
            'tahunPengadaan' => $asset->acquisition_year,
            'condition_status' => $asset->condition_status,
            'kondisi' => $asset->condition_status,
            'purchase_value' => (float) $asset->purchase_value,
            'hargaPerolehan' => $asset->purchase_value,
            'nilaiPerolehan' => $asset->purchase_value,
            'location' => $asset->location ? ['id' => $asset->location->id, 'name' => $asset->location->name] : null,
            'lokasi' => $asset->location?->name,
            'room' => $asset->room ? ['id' => $asset->room->id, 'name' => $asset->room->name] : null,
            'ruangan' => $asset->room?->name,
            'unit' => $asset->unit ? ['id' => $asset->unit->id, 'name' => $asset->unit->name] : null,
            'unit_name' => $asset->unit?->name,
            'owner_name' => $asset->owner_name,
            'penanggungjawab' => $asset->owner_name,
            'registration_number' => $asset->registration_number,
            'nomorRegistrasi' => $asset->registration_number,
            'legal_basis' => $asset->legal_basis,
            'dasarHak' => $asset->legal_basis,
            'start_operation_date' => $asset->start_operation_date?->format('Y-m-d'),
            'jangkaWaktu' => $asset->start_operation_date?->format('Y-m-d'),
            'is_movable' => (bool) $asset->is_movable,
            'status' => $asset->status,
            'kategori' => $asset->category?->name,
            'category' => $asset->category ? ['id' => $asset->category->id, 'name' => $asset->category->name, 'slug' => $asset->category->slug] : null,
            'jenis' => $asset->type?->name,
            'metadata' => $asset->metadata ?? [],
            'document' => $document,
            'document_name' => $document['name'] ?? $document['document_name'] ?? null,
            'document_path' => $document['path'] ?? $document['document_path'] ?? null,
            'dibuat' => $asset->created_at?->format('Y-m-d'),
            'created_at' => $asset->created_at?->toIso8601String(),
            'updated_at' => $asset->updated_at?->toIso8601String(),
        ];
    }

    public function inventory()
    {
        $query = Asset::with(['category', 'location', 'room', 'unit'])
            ->where('asset_category_id', $this->categoryId('inventaris'));
        $this->applyUnitFilter($query);

        $rows = $query->get()->map(fn ($asset, $index) => [
            'id' => (string) $asset->id,
            'no' => $index + 1,
            'tanggalPembukuan' => $asset->created_at?->format('Y-m-d') ?? now()->format('Y-m-d'),
            'kode' => $asset->asset_code,
            'nama' => $asset->name,
            'spesifikasi' => $asset->description ?? '-',
            'jumlah' => $asset->quantity,
            'satuan' => $asset->unit_measure ?? 'Unit',
            'asalBarang' => $asset->acquisition_source ?? '-',
            'tahunPengadaan' => $asset->acquisition_year,
            'kondisi' => $asset->condition_status ?? 'Baik',
            'hargaPerolehan' => 'Rp ' . number_format((float) $asset->purchase_value, 0, ',', '.'),
            'lokasi' => $asset->location?->name ?? '-',
            'unit' => $asset->unit?->name ?? '-',
            'ruangan' => $asset->room?->name ?? '-',
        ]);

        return Inertia::render('Assets/Inventaris', ['rows' => $rows]);
    }

    public function movable()
    {
        $query = Asset::with(['category', 'location', 'unit'])
            ->where('asset_category_id', $this->categoryId('bergerak'));
        $this->applyUnitFilter($query);

        $rows = $query->get()->map(fn ($asset, $index) => [
            'id' => (string) $asset->id,
            'no' => $index + 1,
            'bentukAset' => $asset->name,
            'dasarHak' => $asset->legal_basis ?? 'Hak Milik Yayasan',
            'atasNama' => $asset->owner_name ?? $asset->unit?->name ?? '',
            'tahunPerolehan' => $asset->acquisition_year,
            'nomorRegistrasi' => $asset->registration_number ?? $asset->asset_code,
            'keterangan' => $asset->description ?? '-',
            'dibuat' => $asset->created_at?->format('Y-m-d') ?? now()->format('Y-m-d'),
        ]);

        return Inertia::render('Assets/Bergerak', ['rows' => $rows]);
    }

    public function immovable()
    {
        $query = Asset::with(['category', 'location', 'unit'])
            ->where('asset_category_id', $this->categoryId('tidak-bergerak'));
        $this->applyUnitFilter($query);

        $rows = $query->get()->map(fn ($asset, $index) => [
            'id' => (string) $asset->id,
            'no' => $index + 1,
            'bentukAset' => $asset->name,
            'dasarHak' => $asset->legal_basis ?? 'Hak Milik Yayasan',
            'atasNama' => $asset->owner_name ?? $asset->unit?->name ?? '',
            'tahunPerolehan' => $asset->acquisition_year,
            'jangkaWaktu' => $asset->start_operation_date ? 'Sejak ' . $asset->start_operation_date->format('Y') : 'Tidak terbatas',
            'keterangan' => $asset->description ?? '-',
            'dibuat' => $asset->created_at?->format('Y-m-d') ?? now()->format('Y-m-d'),
        ]);

        return Inertia::render('Assets/TidakBergerak', ['rows' => $rows]);
    }

    public function business()
    {
        $query = Asset::with(['category', 'location', 'unit'])
            ->where('asset_category_id', $this->categoryId('usaha-yayasan'));
        $this->applyUnitFilter($query);

        $rows = $query->get()->map(fn ($asset, $index) => [
            'id' => (string) $asset->id,
            'no' => $index + 1,
            'bentukUsaha' => $asset->name,
            'lokasi' => $asset->location?->name ?? '-',
            'pengelola' => $asset->owner_name ?? $asset->unit?->name ?? '',
            'mulaiOperasional' => $asset->start_operation_date?->format('Y-m-d') ?? now()->format('Y-m-d'),
            'dasarPerjanjian' => $asset->legal_basis ?? '-',
            'keterangan' => $asset->description ?? '-',
            'dibuat' => $asset->created_at?->format('Y-m-d') ?? now()->format('Y-m-d'),
        ]);

        return Inertia::render('Assets/UsahaYayasan', ['rows' => $rows]);
    }

    public function create()
    {
        return Inertia::render('Assets/Create', [
            'category' => request('category', 'inventaris'),
            'mode' => 'create',
        ]);
    }

    public function edit(Asset $asset)
    {
        $category = $asset->category?->slug ?? 'inventaris';

        return Inertia::render('Assets/Create', [
            'asset' => $this->serializeAsset($asset->load(['category', 'type', 'location', 'room', 'unit'])),
            'category' => $category,
            'mode' => 'edit',
        ]);
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'category' => ['required', 'string'],
            'asset_code' => ['nullable', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'unit_measure' => ['nullable', 'string'],
            'acquisition_source' => ['nullable', 'string'],
            'acquisition_year' => ['nullable', 'integer', 'min:1900'],
            'condition_status' => ['nullable', 'string'],
            'purchase_value' => ['nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
            'location_id' => ['nullable', 'integer'],
            'room_id' => ['nullable', 'integer'],
            'unit_id' => ['nullable', 'integer'],
            'owner_name' => ['nullable', 'string'],
            'registration_number' => ['nullable', 'string'],
            'legal_basis' => ['nullable', 'string'],
            'start_operation_date' => ['nullable', 'date'],
            'is_movable' => ['nullable', 'boolean'],
            'status' => ['nullable', 'string'],
            'document' => ['nullable', 'file', 'mimetypes:application/pdf', 'max:10240'],
        ]);

        $categorySlug = $this->resolveCategorySlug($payload['category'] ?? 'inventaris');
        $categoryId = $this->categoryId($categorySlug);
        $documentMetadata = $this->handleDocumentUpload($request->file('document'));

        $asset = Asset::create([
            'asset_category_id' => $categoryId,
            'asset_code' => $payload['asset_code'] ?? $this->generateAssetCode($categorySlug),
            'name' => $payload['name'],
            'description' => $payload['description'] ?? null,
            'quantity' => $payload['quantity'] ?? 1,
            'unit_measure' => $payload['unit_measure'] ?? 'Unit',
            'acquisition_source' => $payload['acquisition_source'] ?? 'Pembelian',
            'acquisition_year' => $payload['acquisition_year'] ?? now()->year,
            'condition_status' => $payload['condition_status'] ?? 'Baik',
            'purchase_value' => $payload['purchase_value'] ?? 0,
            'location_id' => $payload['location_id'] ?? null,
            'room_id' => $payload['room_id'] ?? null,
            'unit_id' => $payload['unit_id'] ?? null,
            'owner_name' => $payload['owner_name'] ?? null,
            'registration_number' => $payload['registration_number'] ?? null,
            'legal_basis' => $payload['legal_basis'] ?? null,
            'start_operation_date' => $payload['start_operation_date'] ?? null,
            'is_movable' => (bool) ($payload['is_movable'] ?? ($categorySlug === 'bergerak')),
            'status' => $payload['status'] ?? 'aktif',
            'metadata' => $documentMetadata ? ['document' => $documentMetadata] : null,
        ]);

        $this->logActivity('create', 'Menambah aset "' . $asset->name . '"', Asset::class, (int) $asset->id);

        return response()->json([
            'success' => true,
            'message' => 'Asset created successfully.',
            'category' => $categorySlug,
            'asset_id' => $asset->id,
        ]);
    }

    public function update(Request $request, Asset $asset)
    {
        $payload = $request->validate([
            'category' => ['nullable', 'string'],
            'asset_code' => ['nullable', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'unit_measure' => ['nullable', 'string'],
            'acquisition_source' => ['nullable', 'string'],
            'acquisition_year' => ['nullable', 'integer', 'min:1900'],
            'condition_status' => ['nullable', 'string'],
            'purchase_value' => ['nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
            'location_id' => ['nullable', 'integer'],
            'room_id' => ['nullable', 'integer'],
            'unit_id' => ['nullable', 'integer'],
            'owner_name' => ['nullable', 'string'],
            'registration_number' => ['nullable', 'string'],
            'legal_basis' => ['nullable', 'string'],
            'start_operation_date' => ['nullable', 'date'],
            'is_movable' => ['nullable', 'boolean'],
            'status' => ['nullable', 'string'],
            'document' => ['nullable', 'file', 'mimetypes:application/pdf', 'max:10240'],
        ]);

        $categorySlug = $this->resolveCategorySlug($payload['category'] ?? $asset->category?->slug ?? 'inventaris');
        $documentMetadata = $this->handleDocumentUpload($request->file('document'), $asset);
        $metadata = is_array($asset->metadata) ? $asset->metadata : [];

        if ($documentMetadata) {
            $metadata['document'] = $documentMetadata;
        }

        $asset->update([
            'asset_category_id' => $this->categoryId($categorySlug),
            'asset_code' => $payload['asset_code'] ?? $asset->asset_code,
            'name' => $payload['name'] ?? $asset->name,
            'description' => $payload['description'] ?? $asset->description,
            'quantity' => $payload['quantity'] ?? $asset->quantity,
            'unit_measure' => $payload['unit_measure'] ?? $asset->unit_measure,
            'acquisition_source' => $payload['acquisition_source'] ?? $asset->acquisition_source,
            'acquisition_year' => $payload['acquisition_year'] ?? $asset->acquisition_year,
            'condition_status' => $payload['condition_status'] ?? $asset->condition_status,
            'purchase_value' => $payload['purchase_value'] ?? $asset->purchase_value,
            'location_id' => $payload['location_id'] ?? $asset->location_id,
            'room_id' => $payload['room_id'] ?? $asset->room_id,
            'unit_id' => $payload['unit_id'] ?? $asset->unit_id,
            'owner_name' => $payload['owner_name'] ?? $asset->owner_name,
            'registration_number' => $payload['registration_number'] ?? $asset->registration_number,
            'legal_basis' => $payload['legal_basis'] ?? $asset->legal_basis,
            'start_operation_date' => $payload['start_operation_date'] ?? $asset->start_operation_date,
            'is_movable' => array_key_exists('is_movable', $payload) ? (bool) $payload['is_movable'] : (bool) $asset->is_movable,
            'status' => $payload['status'] ?? $asset->status,
            'metadata' => $metadata ?: null,
        ]);

        $this->logActivity('update', 'Memperbarui aset "' . $asset->name . '"', Asset::class, (int) $asset->id);

        return response()->json([
            'success' => true,
            'message' => 'Asset updated successfully.',
            'category' => $categorySlug,
            'asset_id' => $asset->id,
        ]);
    }

    public function destroy(Asset $asset)
    {
        $categorySlug = $asset->category?->slug ?? 'inventaris';
        $assetName = $asset->name;
        $redirectRoute = match ($categorySlug) {
            'inventaris' => 'assets.inventaris.index',
            'bergerak' => 'assets.bergerak.index',
            'tidak-bergerak' => 'assets.tidak-bergerak.index',
            'usaha-yayasan' => 'assets.usaha-yayasan.index',
            default => 'assets.inventory.index',
        };

        $asset->delete();

        $this->logActivity('delete', 'Menghapus aset "' . $assetName . '"', Asset::class, (int) $asset->id);

        return redirect()->route($redirectRoute)->with('success', 'Data aset berhasil dihapus.');
    }

    public function showInventory(Asset $asset)
    {
        abort_unless((int) $asset->asset_category_id === $this->categoryId('inventaris'), 404);

        return Inertia::render('Assets/Show', ['asset' => $this->serializeAsset($asset->load(['category', 'type', 'location', 'room', 'unit']))]);
    }

    public function showMovable(Asset $asset)
    {
        abort_unless((int) $asset->asset_category_id === $this->categoryId('bergerak'), 404);

        return Inertia::render('Assets/Show', ['asset' => $this->serializeAsset($asset->load(['category', 'type', 'location', 'room', 'unit']))]);
    }

    public function showImmovable(Asset $asset)
    {
        abort_unless((int) $asset->asset_category_id === $this->categoryId('tidak-bergerak'), 404);

        return Inertia::render('Assets/Show', ['asset' => $this->serializeAsset($asset->load(['category', 'type', 'location', 'room', 'unit']))]);
    }

    public function showBusiness(Asset $asset)
    {
        abort_unless((int) $asset->asset_category_id === $this->categoryId('usaha-yayasan'), 404);

        return Inertia::render('Assets/Show', ['asset' => $this->serializeAsset($asset->load(['category', 'type', 'location', 'room', 'unit']))]);
    }

    private function handleDocumentUpload(?UploadedFile $document, ?Asset $asset = null): ?array
    {
        if (!$document) {
            return null;
        }

        $mimeType = $document->getMimeType();
        $extension = strtolower($document->getClientOriginalExtension());

        if (($mimeType !== 'application/pdf' && $extension !== 'pdf') || !$document->isValid()) {
            throw ValidationException::withMessages([
                'document' => ['Hanya file PDF yang diperbolehkan untuk dokumen usaha yayasan.'],
            ]);
        }

        $path = $document->storeAs('assets/documents', sprintf('%s-%s.%s', now()->format('YmdHis'), str()->random(6), 'pdf'), 'public');

        if (!is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                'document' => ['Gagal mengunggah dokumen. Silakan coba lagi.'],
            ]);
        }

        return [
            'name' => $document->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $mimeType,
            'size' => $document->getSize(),
            'uploaded_at' => now()->toISOString(),
        ];
    }

    private function resolveCategorySlug(string $category): string
    {
        return match (strtolower(trim($category))) {
            'inventaris', 'asset-inventaris' => 'inventaris',
            'bergerak', 'asset-bergerak' => 'bergerak',
            'tidak-bergerak', 'asset-tidak-bergerak', 'tidak bergerak', 'tidak_bergerak' => 'tidak-bergerak',
            'usaha-yayasan', 'usaha yayasan', 'usaha_yayasan', 'business' => 'usaha-yayasan',
            default => 'inventaris',
        };
    }

    private function generateAssetCode(string $categorySlug): string
    {
        $prefix = match ($categorySlug) {
            'inventaris' => 'INV',
            'bergerak' => 'BRG',
            'tidak-bergerak' => 'TBG',
            'usaha-yayasan' => 'USY',
            default => 'AST',
        };

        return sprintf('%s-%s', $prefix, now()->format('YmdHis'));
    }
}
