<?php

namespace App\Http\Controllers;

use App\Models\AsetBergerak;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AsetBergerakController extends Controller
{
    public function index()
    {
        $query = AsetBergerak::query()->latest('created_at');
        $this->applyUnitFilter($query);

        $rows = $query->get()->map(function (AsetBergerak $aset, int $index) {
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
                'nomor_registrasi' => $aset->nomor_registrasi,
                'nomorRegistrasi' => $aset->nomor_registrasi,
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

        return Inertia::render('Assets/Bergerak', ['rows' => $rows]);
    }

    public function create()
    {
        return Inertia::render('Bergerak/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'bentuk_aset' => ['required', 'string', 'max:255'],
            'dasar_hak' => ['nullable', 'string', 'max:255'],
            'atas_nama' => ['nullable', 'string', 'max:255'],
            'tahun_perolehan' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'nomor_registrasi' => ['nullable', 'string', 'max:255'],
            'foto' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'dokumen_pdf' => ['nullable', 'file', 'mimetypes:application/pdf', 'max:10240'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $aset = AsetBergerak::query()->create([
            'bentuk_aset' => $validated['bentuk_aset'],
            'dasar_hak' => $validated['dasar_hak'] ?? null,
            'atas_nama' => $validated['atas_nama'] ?? null,
            'tahun_perolehan' => $validated['tahun_perolehan'] ?? null,
            'nomor_registrasi' => $validated['nomor_registrasi'] ?? null,
            'foto' => $this->handleImageUpload($request->file('foto')),
            'dokumen_pdf' => $this->handleDocumentUpload($request->file('dokumen_pdf')),
            'keterangan' => $validated['keterangan'] ?? null,
        ]);

        $this->logActivity('create', 'Menambah aset bergerak "' . $aset->bentuk_aset . '"', AsetBergerak::class, (int) $aset->id);

        return redirect()->route('aset-bergerak.index')->with('success', 'Aset bergerak berhasil ditambahkan.');
    }

    public function show(AsetBergerak $asetBergerak)
    {
        return Inertia::render('Bergerak/Detail', ['asetBergerak' => $this->serialize($asetBergerak)]);
    }

    public function edit(AsetBergerak $asetBergerak)
    {
        return Inertia::render('Bergerak/Edit', ['asetBergerak' => $this->serialize($asetBergerak)]);
    }

    public function update(Request $request, AsetBergerak $asetBergerak)
    {
        $validated = $request->validate([
            'bentuk_aset' => ['required', 'string', 'max:255'],
            'dasar_hak' => ['nullable', 'string', 'max:255'],
            'atas_nama' => ['nullable', 'string', 'max:255'],
            'tahun_perolehan' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'nomor_registrasi' => ['nullable', 'string', 'max:255'],
            'foto' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'dokumen_pdf' => ['nullable', 'file', 'mimetypes:application/pdf', 'max:10240'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $asetBergerak->fill([
            'bentuk_aset' => $validated['bentuk_aset'],
            'dasar_hak' => $validated['dasar_hak'] ?? $asetBergerak->dasar_hak,
            'atas_nama' => $validated['atas_nama'] ?? $asetBergerak->atas_nama,
            'tahun_perolehan' => $validated['tahun_perolehan'] ?? $asetBergerak->tahun_perolehan,
            'nomor_registrasi' => $validated['nomor_registrasi'] ?? $asetBergerak->nomor_registrasi,
            'keterangan' => $validated['keterangan'] ?? $asetBergerak->keterangan,
        ]);

        if ($request->hasFile('foto')) {
            $this->deleteFileIfExists($asetBergerak->foto);
            $asetBergerak->foto = $this->handleImageUpload($request->file('foto'));
        }

        if ($request->hasFile('dokumen_pdf')) {
            $this->deleteFileIfExists($asetBergerak->dokumen_pdf);
            $asetBergerak->dokumen_pdf = $this->handleDocumentUpload($request->file('dokumen_pdf'));
        }

        $asetBergerak->save();

        $this->logActivity('update', 'Memperbarui aset bergerak "' . $asetBergerak->bentuk_aset . '"', AsetBergerak::class, (int) $asetBergerak->id);

        return redirect()->route('aset-bergerak.index')->with('success', 'Aset bergerak berhasil diperbarui.');
    }

    public function destroy(AsetBergerak $asetBergerak)
    {
        $asetName = $asetBergerak->bentuk_aset;
        $this->deleteFileIfExists($asetBergerak->foto);
        $this->deleteFileIfExists($asetBergerak->dokumen_pdf);
        $asetBergerak->delete();

        $this->logActivity('delete', 'Menghapus aset bergerak "' . $asetName . '"', AsetBergerak::class, (int) $asetBergerak->id);

        return redirect()->route('aset-bergerak.index')->with('success', 'Aset bergerak berhasil dihapus.');
    }

    private function serialize(AsetBergerak $aset): array
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
            'nomor_registrasi' => $aset->nomor_registrasi,
            'nomorRegistrasi' => $aset->nomor_registrasi,
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

        $path = $file->store('aset-bergerak/foto', 'public');

        if (!is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                'foto' => ['Gagal mengunggah foto aset bergerak.'],
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
                'dokumen_pdf' => ['Format dokumen harus PDF.'],
            ]);
        }

        $path = $file->store('aset-bergerak/dokumen', 'public');

        if (!is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                'dokumen_pdf' => ['Gagal mengunggah dokumen PDF.'],
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
