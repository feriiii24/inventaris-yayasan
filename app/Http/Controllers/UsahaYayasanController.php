<?php

namespace App\Http\Controllers;

use App\Models\UsahaYayasan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UsahaYayasanController extends Controller
{
    public function index()
    {
        $query = UsahaYayasan::query()->latest('created_at');
        $this->applyUnitFilter($query);

        $rows = $query->get()->map(function (UsahaYayasan $usahaYayasan, int $index) {
            return [
                'id' => (string) $usahaYayasan->id,
                'no' => $index + 1,
                'bentuk_usaha' => $usahaYayasan->bentuk_usaha,
                'bentukUsaha' => $usahaYayasan->bentuk_usaha,
                'lokasi' => $usahaYayasan->lokasi,
                'pengelola' => $usahaYayasan->pengelola,
                'mulai_operasional' => $usahaYayasan->mulai_operasional?->format('Y-m-d'),
                'mulaiOperasional' => $usahaYayasan->mulai_operasional?->format('Y-m-d'),
                'dasar_perjanjian' => $usahaYayasan->dasar_perjanjian,
                'dasarPerjanjian' => $usahaYayasan->dasar_perjanjian,
                'gambar' => $usahaYayasan->gambar,
                'dokumen' => $usahaYayasan->dokumen,
                'keterangan' => $usahaYayasan->keterangan,
                'created_at' => $usahaYayasan->created_at?->format('Y-m-d'),
                'updated_at' => $usahaYayasan->updated_at?->format('Y-m-d'),
                'dibuat' => $usahaYayasan->created_at?->format('Y-m-d'),
            ];
        });

        return Inertia::render('Assets/UsahaYayasan', ['rows' => $rows]);
    }

    public function create()
    {
        return Inertia::render('UsahaYayasan/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'bentuk_usaha' => ['required', 'string', 'max:255'],
            'lokasi' => ['nullable', 'string', 'max:255'],
            'pengelola' => ['nullable', 'string', 'max:255'],
            'mulai_operasional' => ['nullable', 'date'],
            'dasar_perjanjian' => ['nullable', 'string', 'max:255'],
            'gambar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'dokumen' => ['nullable', 'file', 'mimetypes:application/pdf', 'max:10240'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $usahaYayasan = UsahaYayasan::query()->create([
            'bentuk_usaha' => $validated['bentuk_usaha'],
            'lokasi' => $validated['lokasi'] ?? null,
            'pengelola' => $validated['pengelola'] ?? null,
            'mulai_operasional' => $validated['mulai_operasional'] ?? null,
            'dasar_perjanjian' => $validated['dasar_perjanjian'] ?? null,
            'gambar' => $this->handleImageUpload($request->file('gambar')),
            'dokumen' => $this->handleDocumentUpload($request->file('dokumen')),
            'keterangan' => $validated['keterangan'] ?? null,
        ]);

        $this->logActivity('create', 'Menambah usaha yayasan "' . $usahaYayasan->bentuk_usaha . '"', UsahaYayasan::class, (int) $usahaYayasan->id);

        return redirect()->route('usaha-yayasan.index')->with('success', 'Usaha yayasan berhasil ditambahkan.');
    }

    public function show(UsahaYayasan $usahaYayasan)
    {
        return Inertia::render('UsahaYayasan/Detail', ['usahaYayasan' => $this->serialize($usahaYayasan)]);
    }

    public function edit(UsahaYayasan $usahaYayasan)
    {
        return Inertia::render('UsahaYayasan/Edit', ['usahaYayasan' => $this->serialize($usahaYayasan)]);
    }

    public function update(Request $request, UsahaYayasan $usahaYayasan)
    {
        $validated = $request->validate([
            'bentuk_usaha' => ['required', 'string', 'max:255'],
            'lokasi' => ['nullable', 'string', 'max:255'],
            'pengelola' => ['nullable', 'string', 'max:255'],
            'mulai_operasional' => ['nullable', 'date'],
            'dasar_perjanjian' => ['nullable', 'string', 'max:255'],
            'gambar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'dokumen' => ['nullable', 'file', 'mimetypes:application/pdf', 'max:10240'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $usahaYayasan->fill([
            'bentuk_usaha' => $validated['bentuk_usaha'],
            'lokasi' => $validated['lokasi'] ?? $usahaYayasan->lokasi,
            'pengelola' => $validated['pengelola'] ?? $usahaYayasan->pengelola,
            'mulai_operasional' => $validated['mulai_operasional'] ?? $usahaYayasan->mulai_operasional,
            'dasar_perjanjian' => $validated['dasar_perjanjian'] ?? $usahaYayasan->dasar_perjanjian,
            'keterangan' => $validated['keterangan'] ?? $usahaYayasan->keterangan,
        ]);

        if ($request->hasFile('gambar')) {
            $this->deleteFileIfExists($usahaYayasan->gambar);
            $usahaYayasan->gambar = $this->handleImageUpload($request->file('gambar'));
        }

        if ($request->hasFile('dokumen')) {
            $this->deleteFileIfExists($usahaYayasan->dokumen);
            $usahaYayasan->dokumen = $this->handleDocumentUpload($request->file('dokumen'));
        }

        $usahaYayasan->save();

        $this->logActivity('update', 'Memperbarui usaha yayasan "' . $usahaYayasan->bentuk_usaha . '"', UsahaYayasan::class, (int) $usahaYayasan->id);

        return redirect()->route('usaha-yayasan.index')->with('success', 'Usaha yayasan berhasil diperbarui.');
    }

    public function destroy(UsahaYayasan $usahaYayasan)
    {
        $usahaName = $usahaYayasan->bentuk_usaha;
        $this->deleteFileIfExists($usahaYayasan->gambar);
        $this->deleteFileIfExists($usahaYayasan->dokumen);
        $usahaYayasan->delete();

        $this->logActivity('delete', 'Menghapus usaha yayasan "' . $usahaName . '"', UsahaYayasan::class, (int) $usahaYayasan->id);

        return redirect()->route('usaha-yayasan.index')->with('success', 'Usaha yayasan berhasil dihapus.');
    }

    private function serialize(UsahaYayasan $usahaYayasan): array
    {
        $dokumenName = $usahaYayasan->dokumen ? basename($usahaYayasan->dokumen) : null;

        $gambarUrl = $this->asPublicUrl($usahaYayasan->gambar);
        $dokumenUrl = $this->asPublicUrl($usahaYayasan->dokumen);

        return [
            'id' => (string) $usahaYayasan->id,
            'bentuk_usaha' => $usahaYayasan->bentuk_usaha,
            'bentukUsaha' => $usahaYayasan->bentuk_usaha,
            'lokasi' => $usahaYayasan->lokasi,
            'pengelola' => $usahaYayasan->pengelola,
            'mulai_operasional' => $usahaYayasan->mulai_operasional?->format('Y-m-d'),
            'mulaiOperasional' => $usahaYayasan->mulai_operasional?->format('Y-m-d'),
            'dasar_perjanjian' => $usahaYayasan->dasar_perjanjian,
            'dasarPerjanjian' => $usahaYayasan->dasar_perjanjian,
            'gambar' => $usahaYayasan->gambar,
            'gambar_url' => $gambarUrl,
            'dokumen' => $usahaYayasan->dokumen,
            'dokumen_url' => $dokumenUrl,
            'dokumen_name' => $dokumenName,
            'keterangan' => $usahaYayasan->keterangan,
            'created_at' => $usahaYayasan->created_at?->format('Y-m-d'),
            'updated_at' => $usahaYayasan->updated_at?->format('Y-m-d'),
            'dibuat' => $usahaYayasan->created_at?->format('Y-m-d'),
        ];
    }

    private function handleImageUpload($file): ?string
    {
        if (!$file) {
            return null;
        }

        $disk = 'public';
        $path = $file->store('usaha-yayasan/gambar', $disk);

        if (!is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                'gambar' => ['Gagal mengunggah gambar usaha yayasan.'],
            ]);
        }

        return $path;
    }

    private function handleDocumentUpload($file): ?string
    {
        if (!$file) {
            return null;
        }

        $mimeType = $file->getMimeType();
        $extension = strtolower($file->getClientOriginalExtension());

        if (($mimeType !== 'application/pdf' && $extension !== 'pdf') || !$file->isValid()) {
            throw ValidationException::withMessages([
                'dokumen' => ['Hanya file PDF yang diperbolehkan untuk dokumen usaha yayasan.'],
            ]);
        }

        $path = $file->store('usaha-yayasan/dokumen', 'public');

        if (!is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                'dokumen' => ['Gagal mengunggah dokumen usaha yayasan.'],
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

        $url = Storage::disk('public')->url($path);

        if (str_contains($url, '://')) {
            $parsed = parse_url($url);
            return $parsed['path'] ?? $url;
        }

        return $url;
    }
}
