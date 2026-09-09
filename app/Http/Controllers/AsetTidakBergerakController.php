<?php

namespace App\Http\Controllers;

use App\Models\AsetTidakBergerak;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AsetTidakBergerakController extends Controller
{
    public function index()
    {
        $query = AsetTidakBergerak::query()->latest('created_at');
        $this->applyUnitFilter($query);

        $rows = $query->get()->map(function (AsetTidakBergerak $aset, int $index) {
            return [
                'id' => (string) $aset->id,
                'no' => $index + 1,
                'bentuk_aset' => $aset->bentuk_aset,
                'bentukAset' => $aset->bentuk_aset,
                'dasar_hak' => $aset->dasar_hak,
                'dasarHak' => $aset->dasar_hak,
                'atas_nama' => $aset->atas_nama,
                'atasNama' => $aset->atas_nama,
                'tahun_perolehan' => $aset->tahun_perolehan,
                'tahunPerolehan' => $aset->tahun_perolehan,
                'jangka_waktu' => $aset->jangka_waktu,
                'jangkaWaktu' => $aset->jangka_waktu,
                'foto' => $aset->foto,
                'foto_url' => $this->asPublicUrl($aset->foto),
                'dokumen_pdf' => $aset->dokumen_pdf,
                'dokumenPdf' => $aset->dokumen_pdf,
                'dokumen_pdf_url' => $this->asPublicUrl($aset->dokumen_pdf),
                'keterangan' => $aset->keterangan,
                'created_at' => $aset->created_at?->format('Y-m-d'),
                'updated_at' => $aset->updated_at?->format('Y-m-d'),
                'dibuat' => $aset->created_at?->format('Y-m-d'),
            ];
        });

        return Inertia::render('Assets/TidakBergerak', ['rows' => $rows]);
    }

    public function create()
    {
        return Inertia::render('TidakBergerak/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'bentuk_aset' => ['required', 'string', 'max:255'],
            'dasar_hak' => ['nullable', 'string', 'max:255'],
            'atas_nama' => ['nullable', 'string', 'max:255'],
            'tahun_perolehan' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'jangka_waktu' => ['nullable', 'string', 'max:255'],
            'foto' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'dokumen_pdf' => ['nullable', 'file', 'mimetypes:application/pdf', 'max:10240'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $aset = AsetTidakBergerak::query()->create([
            'bentuk_aset' => $validated['bentuk_aset'],
            'dasar_hak' => $validated['dasar_hak'] ?? null,
            'atas_nama' => $validated['atas_nama'] ?? null,
            'tahun_perolehan' => $validated['tahun_perolehan'] ?? null,
            'jangka_waktu' => $validated['jangka_waktu'] ?? null,
            'foto' => $this->handleImageUpload($request->file('foto')),
            'dokumen_pdf' => $this->handleDocumentUpload($request->file('dokumen_pdf')),
            'keterangan' => $validated['keterangan'] ?? null,
        ]);

        $this->logActivity('create', 'Menambah aset tidak bergerak "' . $aset->bentuk_aset . '"', AsetTidakBergerak::class, (int) $aset->id);

        return redirect()->route('aset-tidak-bergerak.index')->with('success', 'Aset tidak bergerak berhasil ditambahkan.');
    }

    public function show(AsetTidakBergerak $asetTidakBergerak)
    {
        return Inertia::render('TidakBergerak/Detail', ['asetTidakBergerak' => $this->serialize($asetTidakBergerak)]);
    }

    public function edit(AsetTidakBergerak $asetTidakBergerak)
    {
        return Inertia::render('TidakBergerak/Edit', ['asetTidakBergerak' => $this->serialize($asetTidakBergerak)]);
    }

    public function update(Request $request, AsetTidakBergerak $asetTidakBergerak)
    {
        $validated = $request->validate([
            'bentuk_aset' => ['required', 'string', 'max:255'],
            'dasar_hak' => ['nullable', 'string', 'max:255'],
            'atas_nama' => ['nullable', 'string', 'max:255'],
            'tahun_perolehan' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'jangka_waktu' => ['nullable', 'string', 'max:255'],
            'foto' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'dokumen_pdf' => ['nullable', 'file', 'mimetypes:application/pdf', 'max:10240'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $asetTidakBergerak->fill([
            'bentuk_aset' => $validated['bentuk_aset'],
            'dasar_hak' => $validated['dasar_hak'] ?? $asetTidakBergerak->dasar_hak,
            'atas_nama' => $validated['atas_nama'] ?? $asetTidakBergerak->atas_nama,
            'tahun_perolehan' => $validated['tahun_perolehan'] ?? $asetTidakBergerak->tahun_perolehan,
            'jangka_waktu' => $validated['jangka_waktu'] ?? $asetTidakBergerak->jangka_waktu,
            'keterangan' => $validated['keterangan'] ?? $asetTidakBergerak->keterangan,
        ]);

        if ($request->hasFile('foto')) {
            $this->deleteFileIfExists($asetTidakBergerak->foto);
            $asetTidakBergerak->foto = $this->handleImageUpload($request->file('foto'));
        }

        if ($request->hasFile('dokumen_pdf')) {
            $this->deleteFileIfExists($asetTidakBergerak->dokumen_pdf);
            $asetTidakBergerak->dokumen_pdf = $this->handleDocumentUpload($request->file('dokumen_pdf'));
        }

        $asetTidakBergerak->save();

        $this->logActivity('update', 'Memperbarui aset tidak bergerak "' . $asetTidakBergerak->bentuk_aset . '"', AsetTidakBergerak::class, (int) $asetTidakBergerak->id);

        return redirect()->route('aset-tidak-bergerak.index')->with('success', 'Aset tidak bergerak berhasil diperbarui.');
    }

    public function destroy(AsetTidakBergerak $asetTidakBergerak)
    {
        $asetName = $asetTidakBergerak->bentuk_aset;
        $this->deleteFileIfExists($asetTidakBergerak->foto);
        $this->deleteFileIfExists($asetTidakBergerak->dokumen_pdf);
        $asetTidakBergerak->delete();

        $this->logActivity('delete', 'Menghapus aset tidak bergerak "' . $asetName . '"', AsetTidakBergerak::class, (int) $asetTidakBergerak->id);

        return redirect()->route('aset-tidak-bergerak.index')->with('success', 'Aset tidak bergerak berhasil dihapus.');
    }

    private function serialize(AsetTidakBergerak $aset): array
    {
        return [
            'id' => (string) $aset->id,
            'bentuk_aset' => $aset->bentuk_aset,
            'bentukAset' => $aset->bentuk_aset,
            'dasar_hak' => $aset->dasar_hak,
            'dasarHak' => $aset->dasar_hak,
            'atas_nama' => $aset->atas_nama,
            'atasNama' => $aset->atas_nama,
            'tahun_perolehan' => $aset->tahun_perolehan,
            'tahunPerolehan' => $aset->tahun_perolehan,
            'jangka_waktu' => $aset->jangka_waktu,
            'jangkaWaktu' => $aset->jangka_waktu,
            'foto' => $aset->foto,
            'foto_url' => $this->asPublicUrl($aset->foto),
            'dokumen_pdf' => $aset->dokumen_pdf,
            'dokumenPdf' => $aset->dokumen_pdf,
            'dokumen_pdf_url' => $this->asPublicUrl($aset->dokumen_pdf),
            'dokumen_url' => $this->asPublicUrl($aset->dokumen_pdf),
            'keterangan' => $aset->keterangan,
            'created_at' => $aset->created_at?->format('Y-m-d'),
            'updated_at' => $aset->updated_at?->format('Y-m-d'),
            'dibuat' => $aset->created_at?->format('Y-m-d'),
        ];
    }

    private function handleImageUpload($file): ?string
    {
        if (!$file) {
            return null;
        }

        $path = $file->store('aset-tidak-bergerak/foto', 'public');

        if (!is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                'foto' => ['Gagal mengunggah foto aset tidak bergerak.'],
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
                'dokumen_pdf' => ['Hanya file PDF yang diperbolehkan untuk dokumen aset tidak bergerak.'],
            ]);
        }

        $path = $file->store('aset-tidak-bergerak/dokumen', 'public');

        if (!is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                'dokumen_pdf' => ['Gagal mengunggah dokumen aset tidak bergerak.'],
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
