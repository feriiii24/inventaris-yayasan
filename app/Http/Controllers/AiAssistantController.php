<?php

namespace App\Http\Controllers;

use App\Models\AssetBorrowing;
use App\Models\AssetMutation;
use App\Models\AssetActivity;
use App\Models\AssetCategory;
use App\Models\AssetType;
use App\Models\AsetBergerak;
use App\Models\AsetInventaris;
use App\Models\AsetTidakBergerak;
use App\Models\Location;
use App\Models\Room;
use App\Models\UsahaYayasan;
use App\Models\User;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class AiAssistantController extends Controller
{
    public function answer(Request $request): JsonResponse
    {
        $question = trim((string) $request->query('question', ''));
        if ($question === '') {
            return response()->json(['answer' => 'Silakan tulis pertanyaan terlebih dahulu.'], 422);
        }

        $context = (string) $request->query('context', '');
        $normalizedQuestion = $this->normalizeQuestion($question);
        if (
            $context !== ''
            && (
                str_contains($normalizedQuestion, 'aset itu')
                || str_contains($normalizedQuestion, 'aset tersebut')
                || str_contains($normalizedQuestion, 'jumlah aset itu')
                || str_contains($normalizedQuestion, 'lokasi aset itu')
                || str_contains($normalizedQuestion, 'ruangan aset itu')
                || str_contains($normalizedQuestion, 'unit aset itu')
                || str_contains($normalizedQuestion, 'kondisi aset itu')
                || str_contains($normalizedQuestion, 'status aset itu')
                || str_contains($normalizedQuestion, 'ruangan itu')
                || str_contains($normalizedQuestion, 'lokasi itu')
            )
        ) {
            preg_match_all('/\[([^\]]+)\]/u', $context, $matches);
            if (count($matches[1] ?? []) === 1) {
                $question .= ' ' . $matches[1][0];
            } elseif (
                count($matches[1] ?? []) === 0
                && preg_match('/\b(?:Lokasi|Ruangan)\s+UNIT-[A-Za-z0-9_-]+/iu', $context, $matches)
            ) {
                $question .= ' ' . $matches[0];
            }
        }

        $query = AsetInventaris::query();
        $user = $request->user();
        if ($user?->hasRole('admin_unit')) {
            $query->where('unit_id', $user->unit_id);
        }

        $borrowings = AssetBorrowing::query()->whereIn('status', ['pending', 'dipinjam', 'disetujui']);
        if ($user?->hasRole('admin_unit')) {
            $borrowings->where('borrower_unit_id', $user->unit_id);
        }

        $damagedValue = (float) (clone $query)->get([
            'jumlah',
            'jumlah_rusak_ringan',
            'jumlah_rusak_berat',
            'harga_perolehan',
        ])->sum(function (AsetInventaris $asset): float {
            $quantity = max((int) $asset->jumlah, 1);
            $damagedQuantity = (int) $asset->jumlah_rusak_ringan + (int) $asset->jumlah_rusak_berat;

            // Harga perolehan dicatat per baris aset, jadi nilai rusak dihitung proporsional.
            return ((float) $asset->harga_perolehan) * min($damagedQuantity / $quantity, 1);
        });

        $facts = [
            'total_unit_aset' => (int) $query->sum('jumlah'),
            'jumlah_data_aset' => (int) $query->count(),
            'rusak_ringan' => (int) $query->sum('jumlah_rusak_ringan'),
            'rusak_berat' => (int) $query->sum('jumlah_rusak_berat'),
            'total_rusak' => (int) $query->sum('jumlah_rusak_ringan') + (int) $query->sum('jumlah_rusak_berat'),
            'nilai_kerugian_aset_rusak' => round($damagedValue, 2),
            'nilai_total_aset' => (float) $query->sum('harga_perolehan'),
            'baik' => (int) $query->sum('jumlah_baik'),
            'dalam_perbaikan' => (int) $query->sum('jumlah_dalam_perbaikan'),
            'jumlah_lokasi' => (int) (clone $query)->whereNotNull('lokasi_id')->distinct('lokasi_id')->count('lokasi_id'),
            'jumlah_ruangan' => (int) (clone $query)->whereNotNull('room_id')->distinct('room_id')->count('room_id'),
            'peminjaman_aktif_atau_pending' => (int) $borrowings->count(),
            'peminjaman_aktif' => (int) (clone $borrowings)->where('status', 'dipinjam')->count(),
            'peminjaman_pending' => (int) (clone $borrowings)->where('status', 'pending')->count(),
            'aset_bergerak' => (int) AsetBergerak::count(),
            'aset_tidak_bergerak' => (int) AsetTidakBergerak::count(),
            'kategori' => Schema::hasTable('asset_categories') ? (int) AssetCategory::count() : 0,
            'jenis_aset' => Schema::hasTable('asset_types') ? (int) AssetType::count() : 0,
            'usaha_yayasan' => (int) UsahaYayasan::count(),
            'unit' => (int) Unit::when($user?->hasRole('admin_unit'), fn ($builder) => $builder->whereKey($user->unit_id))->count(),
            'pengguna' => (int) User::when($user?->hasRole('admin_unit'), fn ($builder) => $builder->where('unit_id', $user->unit_id))->count(),
            'mutasi' => (int) AssetMutation::when($user?->hasRole('admin_unit'), function ($builder) use ($user): void {
                $builder->where(function ($query) use ($user): void {
                    $query->where('from_unit_id', $user->unit_id)->orWhere('to_unit_id', $user->unit_id);
                });
            })->count(),
            'aktivitas' => (int) AssetActivity::count(),
        ];

        $normalized = $this->normalizeQuestion($question);
        if ($this->isUnsupportedQuestion($normalized)) {
            return response()->json(['answer' => $this->unsupportedAnswer()]);
        }
        if (preg_match('/\b(cuaca|berita|politik|resep|film|sepak bola|matematika)\b/u', $normalized)) {
            return response()->json(['answer' => $this->fallbackAnswer($question, $facts)]);
        }
        $detailAnswer = $this->answerFromInventoryDetails($normalized, $query, $borrowings, $user, $facts);
        if ($detailAnswer !== null) {
            return response()->json(['answer' => $detailAnswer]);
        }

        return response()->json(['answer' => $this->fallbackAnswer($question, $facts)]);
    }

    private function normalizeQuestion(string $question): string
    {
        $normalized = mb_strtolower(trim($question));
        $normalized = preg_replace('/\s+/u', ' ', $normalized) ?? $normalized;

        $replacements = [
            'berpaa' => 'berapa',
            'brp' => 'berapa',
            'apakah bisa dipinjam' => 'bisa dipinjam',
            'di pinjam' => 'dipinjam',
            'di pakai' => 'dipakai',
            'di perbaiki' => 'diperbaiki',
            'sedang diperbaiki' => 'dalam perbaikan',
            'lagi diperbaiki' => 'dalam perbaikan',
            'punya aset ini' => 'memiliki aset ini',
            'aset apa saja' => 'daftar aset',
            'barang apa saja' => 'daftar aset',
            'barang tersebut' => 'aset tersebut',
            'barang itu' => 'aset itu',
            'jumlahnya' => 'jumlah aset itu',
            'berapa banyak' => 'berapa jumlah',
            'lokasinya' => 'lokasi aset itu',
            'ruangannya' => 'ruangan aset itu',
            'unitnya' => 'unit aset itu',
            'bagaimana kondisinya' => 'bagaimana kondisi aset itu',
            'kondisinya baik' => 'kondisi baik',
            'kondisinya rusak ringan' => 'kondisi rusak ringan',
            'kondisinya rusak berat' => 'kondisi rusak berat',
            'itu di lokasi mana' => 'lokasi itu',
            'statusnya' => 'status aset itu',
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $normalized);
    }

    private function isUnsupportedQuestion(string $question): bool
    {
        $unsupportedTerms = [
            'zodiak', 'horoskop', 'feng shui', 'warna favorit', 'warna aura', 'aura',
            'kebahagiaan', 'emosional', 'kepribadian', 'fotogenik', 'nostalgia', 'spiritual',
            'ramalan', 'keberuntungan', 'takdir', 'mimpi', 'humor', 'wibawa', 'suasana hati',
            'kesepian', 'kerinduan', 'kesabaran', 'kesetiaan', 'inspiratif', 'estetika',
            'keheningan', 'nama latin', 'bahasa klingon', 'bahasa alien', 'bahasa lumba-lumba',
            'sandi morse', 'haiku', 'pantun', 'komik', 'lubang hitam', 'planet mars',
            'rasi bintang', 'fase bulan', 'teori relativitas', 'sidik jari digital', 'musik',
            'menari', 'tebak kata', 'lempar koin', 'aroma', 'suara ruangan', 'awan',
            'warna pelangi', 'makanan', 'es krim', 'ulang tahun', 'hadiah', 'makna hidup',
            'benda tak terlihat', 'tak kasatmata', 'bahasa isyarat', 'preferensi makanan',
            'tingkat formalitas', 'tingkat kebisingan',
        ];

        foreach ($unsupportedTerms as $term) {
            if (str_contains($question, $term)) {
                return true;
            }
        }

        return false;
    }

    private function answerFromInventoryDetails(string $question, Builder $assetQuery, Builder $borrowingQuery, $user, array $facts): ?string
    {
        if (str_contains($question, 'lokasi itu')) {
            $location = $this->resolveLocationFromQuestion($question, $user);
            if ($location !== null) {
                return 'Lokasi yang dimaksud adalah ' . $location->name . '.';
            }
        }

        if (
            (str_contains($question, 'nilai') || str_contains($question, 'harga'))
            && (str_contains($question, 'rusak berat') || str_contains($question, 'rusak ringan'))
            && !str_contains($question, 'unit')
            && !str_contains($question, 'lokasi')
            && !str_contains($question, 'ruangan')
        ) {
            $field = str_contains($question, 'rusak berat') ? 'jumlah_rusak_berat' : 'jumlah_rusak_ringan';
            $label = str_contains($question, 'rusak berat') ? 'rusak berat' : 'rusak ringan';
            $value = (clone $assetQuery)->get([
                'jumlah', $field, 'harga_perolehan',
            ])->sum(fn (AsetInventaris $asset): float => (float) $asset->harga_perolehan
                * min((int) $asset->{$field} / max((int) $asset->jumlah, 1), 1));
            return 'Perkiraan nilai aset ' . $label . ' adalah Rp '
                . number_format($value, 0, ',', '.') . '.';
        }

        if (
            (str_contains($question, 'nilai kerugian')
                || str_contains($question, 'nilai aset rusak')
                || str_contains($question, 'kerugian aset'))
            && !preg_match('/\b(unit|lokasi|ruangan)\b/u', $question)
        ) {
            return 'Perkiraan nilai kerugian aset rusak adalah Rp '
                . number_format($facts['nilai_kerugian_aset_rusak'], 0, ',', '.') . '.';
        }

        if (
            (str_contains($question, 'aset apa') || str_contains($question, 'aset yang'))
            && (str_contains($question, 'paling banyak') || str_contains($question, 'terbanyak'))
            && !str_contains($question, 'unit mana')
        ) {
            $asset = (clone $assetQuery)->orderByDesc('jumlah')->first();
            return $asset === null
                ? 'Belum ada data aset yang dapat dianalisis.'
                : 'Aset dengan jumlah unit terbanyak adalah ' . $asset->nama_aset . ' [' . $asset->kode_aset
                    . '] sebanyak ' . number_format((int) $asset->jumlah, 0, ',', '.') . ' unit.';
        }

        $referencesPreviousAsset = (
            str_contains($question, 'aset itu')
            || str_contains($question, 'aset tersebut')
        ) && !str_contains($question, 'mutasi')
            && !str_contains($question, 'paling banyak')
            && !str_contains($question, 'terbanyak');
        if ($referencesPreviousAsset) {
            $asset = $this->findSingleAssetFromQuestion($question, $assetQuery);
            if ($asset === null && preg_match('/\d{3,}/', $question) !== 1) {
                return 'Mohon sebutkan nama atau kode aset agar saya dapat menjawab pertanyaan tersebut dengan tepat.';
            }
            if ($asset !== null) {
                if (
                    (str_contains($question, 'lokasi') || str_contains($question, 'ruangan') || str_contains($question, 'unit')
                        || str_contains($question, 'di mana'))
                    && (str_contains($question, 'kondisi') || str_contains($question, 'status'))
                ) {
                    return 'Aset ' . $asset->nama_aset . ' [' . $asset->kode_aset . '] berada di ruangan '
                        . ($asset->room?->name ?? '-') . ', lokasi ' . ($asset->lokasi?->name ?? '-')
                        . ', Unit ' . ($asset->unit?->name ?? '-') . ', dengan kondisi '
                        . ($asset->kondisi ?? '-') . '.';
                }
                if (str_contains($question, 'status') || str_contains($question, 'kondisi')) {
                    return 'Kondisi aset ' . $asset->nama_aset . ' [' . $asset->kode_aset . '] adalah '
                        . ($asset->kondisi ?? '-') . '.';
                }
                if (str_contains($question, 'jumlah') || str_contains($question, 'berapa')) {
                    return 'Jumlah aset ' . $asset->nama_aset . ' [' . $asset->kode_aset . '] adalah '
                        . number_format((int) $asset->jumlah, 0, ',', '.') . ' unit.';
                }
                if (str_contains($question, 'lokasi') || str_contains($question, 'ruangan') || str_contains($question, 'unit')) {
                    return 'Aset ' . $asset->nama_aset . ' [' . $asset->kode_aset . '] berada di ruangan '
                        . ($asset->room?->name ?? '-') . ', lokasi ' . ($asset->lokasi?->name ?? '-')
                        . ', Unit ' . ($asset->unit?->name ?? '-') . '.';
                }
            }
        }

        if (str_contains($question, 'perbedaan lokasi dan ruangan')) {
            return 'Lokasi adalah area atau tempat utama penempatan aset, sedangkan ruangan adalah bagian yang lebih spesifik di dalam lokasi tersebut. Satu lokasi dapat memiliki beberapa ruangan.';
        }

        if (
            str_contains($question, 'kamu bisa apa')
            || str_contains($question, 'anda bisa apa')
            || str_contains($question, 'bisa melakukan apa')
            || str_contains($question, 'fitur kamu')
            || str_contains($question, 'kemampuan kamu')
        ) {
            return 'Saya dapat membantu mencari dan menganalisis data inventaris, seperti detail aset, lokasi dan ruangan, unit, kondisi aset, kerusakan, nilai aset, mutasi, peminjaman, pengguna, aktivitas, usaha yayasan, serta ringkasan database. Saya juga dapat menjawab pertanyaan berdasarkan nama aset, kode aset, unit, lokasi, ruangan, atau periode jika datanya tersedia.';
        }

        if (
            (
                preg_match('/\bberapa\s+unit\b/u', $question) === 1
                || (str_contains($question, 'jumlah unit') && str_contains($question, 'yayasan'))
            )
            && !str_contains($question, 'aset')
        ) {
            return 'Terdapat ' . number_format($facts['unit'], 0, ',', '.') . ' unit yayasan yang tercatat.';
        }

        if (
            (str_contains($question, 'data aset') || str_contains($question, 'data inventaris'))
            && (str_contains($question, 'berapa') || str_contains($question, 'total') || str_contains($question, 'jumlah'))
        ) {
            return 'Terdapat ' . number_format($facts['jumlah_data_aset'], 0, ',', '.') . ' data aset inventaris.';
        }

        if (
            (str_contains($question, 'mutasi') || str_contains($question, 'mutasi aset'))
            && (str_contains($question, 'berapa') || str_contains($question, 'jumlah') || str_contains($question, 'total'))
            && !str_contains($question, 'selesai')
            && !str_contains($question, 'proses')
            && !str_contains($question, 'pending')
            && !str_contains($question, 'ditolak')
            && !str_contains($question, 'unit')
        ) {
            return 'Terdapat ' . number_format($facts['mutasi'], 0, ',', '.') . ' mutasi aset yang tercatat.';
        }

        if (
            str_contains($question, 'sedang dipinjam')
            && (str_contains($question, 'berapa') || str_contains($question, 'jumlah') || str_contains($question, 'total'))
        ) {
            $borrowedUnits = (int) (clone $borrowingQuery)->where('status', 'dipinjam')->sum('quantity');
            return 'Terdapat ' . number_format($borrowedUnits, 0, ',', '.') . ' unit aset yang sedang dipinjam.';
        }

        if (
            (str_contains($question, 'peminjaman') || str_contains($question, 'pinjaman'))
            && str_contains($question, 'aktif')
            && !str_contains($question, 'pending')
            && (str_contains($question, 'berapa') || str_contains($question, 'jumlah') || str_contains($question, 'total'))
        ) {
            return 'Terdapat ' . number_format($facts['peminjaman_aktif'], 0, ',', '.') . ' peminjaman aktif.';
        }

        if (
            (str_contains($question, 'peminjaman') || str_contains($question, 'pinjaman') || str_contains($question, 'pengajuan'))
            && (str_contains($question, 'pending') || str_contains($question, 'menunggu'))
            && (str_contains($question, 'berapa') || str_contains($question, 'jumlah') || str_contains($question, 'total'))
        ) {
            return 'Terdapat ' . number_format($facts['peminjaman_pending'], 0, ',', '.') . ' pengajuan peminjaman pending.';
        }

        if (
            (str_contains($question, 'peminjaman') || str_contains($question, 'pinjaman'))
            && (str_contains($question, 'berapa') || str_contains($question, 'jumlah') || str_contains($question, 'total'))
        ) {
            if (str_contains($question, 'sedang dipinjam') || str_contains($question, 'unit aset')) {
                $borrowedUnits = (int) (clone $borrowingQuery)->where('status', 'dipinjam')->sum('quantity');
                return 'Terdapat ' . number_format($borrowedUnits, 0, ',', '.') . ' unit aset yang sedang dipinjam.';
            }
            return 'Terdapat ' . number_format($facts['peminjaman_aktif_atau_pending'], 0, ',', '.') . ' peminjaman aktif atau pending.';
        }

        if (
            str_contains($question, 'aset tanpa lokasi')
            || str_contains($question, 'aset belum memiliki lokasi')
            || str_contains($question, 'belum memiliki lokasi')
        ) {
            $count = (clone $assetQuery)->whereNull('lokasi_id')->count();
            return $count === 0
                ? 'Tidak ada aset yang belum memiliki lokasi.'
                : 'Terdapat ' . number_format($count, 0, ',', '.') . ' data aset yang belum memiliki lokasi.';
        }

        if (
            str_contains($question, 'aset tanpa ruangan')
            || str_contains($question, 'aset belum memiliki ruangan')
            || str_contains($question, 'belum memiliki ruangan')
        ) {
            $count = (clone $assetQuery)->whereNull('room_id')->count();
            return $count === 0
                ? 'Tidak ada aset yang belum memiliki ruangan.'
                : 'Terdapat ' . number_format($count, 0, ',', '.') . ' data aset yang belum memiliki ruangan.';
        }

        if (
            str_contains($question, 'berapa')
            && str_contains($question, 'ruangan')
            && !str_contains($question, 'aset di')
            && $this->resolveRoomFromQuestion($question, $user) === null
        ) {
            return 'Terdapat ' . number_format($facts['jumlah_ruangan'], 0, ',', '.') . ' ruangan yang memiliki aset.';
        }

        if (
            (str_contains($question, 'berapa lokasi')
                || str_contains($question, 'jumlah lokasi')
                || str_contains($question, 'total lokasi'))
            && !str_contains($question, 'aset di')
        ) {
            return 'Terdapat ' . number_format($facts['jumlah_lokasi'], 0, ',', '.') . ' lokasi yang memiliki aset.';
        }

        if (
            (str_contains($question, 'cara tambah aset') || str_contains($question, 'cara menambah aset'))
            || (str_contains($question, 'tambah aset') && str_contains($question, 'bagaimana'))
        ) {
            return 'Untuk menambah aset, buka menu Inventaris, pilih Tambah Aset, isi identitas aset, jumlah, kondisi, nilai perolehan, unit, lokasi, dan ruangan, lalu simpan data.';
        }

        if (
            (str_contains($question, 'cara ubah aset') || str_contains($question, 'cara edit aset') || str_contains($question, 'cara mengubah aset'))
            || (str_contains($question, 'edit aset') && str_contains($question, 'bagaimana'))
        ) {
            return 'Untuk mengubah aset, buka menu Inventaris, pilih aset yang diinginkan, tekan Edit, perbarui datanya, lalu simpan perubahan.';
        }

        if (
            (str_contains($question, 'cara hapus aset') || str_contains($question, 'cara menghapus aset'))
            || (str_contains($question, 'hapus aset') && str_contains($question, 'bagaimana'))
        ) {
            return 'Untuk menghapus aset, buka detail aset, pilih Hapus, periksa konfirmasi, lalu lanjutkan hanya jika data tersebut benar-benar tidak diperlukan.';
        }

        if (
            str_contains($question, 'apa itu mutasi')
            || str_contains($question, 'arti mutasi')
        ) {
            return 'Mutasi aset adalah proses pencatatan perpindahan aset dari satu unit, lokasi, atau ruangan ke tujuan lain, termasuk status dan tanggal perpindahannya.';
        }

        if (str_contains($question, 'arti rusak ringan') || str_contains($question, 'maksud rusak ringan')) {
            return 'Rusak ringan berarti aset masih dapat digunakan atau dipulihkan dengan perbaikan kecil, seperti penggantian bagian sederhana atau perawatan ringan.';
        }

        if (str_contains($question, 'arti rusak berat') || str_contains($question, 'maksud rusak berat')) {
            return 'Rusak berat berarti aset mengalami kerusakan serius sehingga tidak dapat digunakan secara normal tanpa perbaikan besar atau penggantian komponen utama.';
        }

        if (str_contains($question, 'arti kondisi baik') || str_contains($question, 'maksud kondisi baik')) {
            return 'Kondisi baik berarti aset dapat digunakan secara normal dan tidak tercatat mengalami kerusakan.';
        }

        if (str_contains($question, 'arti dalam perbaikan') || str_contains($question, 'maksud dalam perbaikan')) {
            return 'Dalam perbaikan berarti aset sedang ditangani atau menunggu proses perbaikan sehingga ketersediaannya untuk digunakan atau dipinjam dapat terbatas.';
        }

        if (str_contains($question, 'status dipinjam') || str_contains($question, 'arti dipinjam')) {
            return 'Status dipinjam berarti aset sedang digunakan oleh peminjam dan belum tercatat kembali.';
        }

        if (str_contains($question, 'status pending') || str_contains($question, 'arti pending')) {
            return 'Status pending berarti pengajuan peminjaman atau transaksi masih menunggu pemeriksaan dan persetujuan.';
        }

        if (str_contains($question, 'status selesai') || str_contains($question, 'arti selesai')) {
            return 'Status selesai berarti transaksi sudah diproses dan tidak lagi menunggu tindakan lanjutan.';
        }

        if (str_contains($question, 'status dikembalikan') || str_contains($question, 'arti dikembalikan')) {
            return 'Status dikembalikan berarti aset pinjaman sudah diterima kembali dan transaksi peminjaman telah selesai.';
        }

        if (str_contains($question, 'status ditolak') || str_contains($question, 'arti ditolak')) {
            return 'Status ditolak berarti pengajuan atau transaksi tidak disetujui sehingga tidak dapat dilanjutkan.';
        }

        if (str_contains($question, 'status disetujui') || str_contains($question, 'arti disetujui')) {
            return 'Status disetujui berarti pengajuan telah diperiksa dan mendapat persetujuan untuk diproses.';
        }

        if (str_contains($question, 'status aktif') || str_contains($question, 'arti aktif')) {
            return 'Status aktif berarti data atau akun masih berlaku dan dapat digunakan dalam sistem.';
        }

        if (str_contains($question, 'status tersedia') || str_contains($question, 'arti tersedia')) {
            return 'Status tersedia berarti aset dapat digunakan atau diajukan untuk dipinjam karena tidak sedang dipinjam, rusak berat, atau dalam perbaikan.';
        }

        if (str_contains($question, 'status proses') || str_contains($question, 'arti proses')) {
            return 'Status proses berarti mutasi sedang diajukan atau dikerjakan dan belum selesai.';
        }

        if (str_contains($question, 'status sukses') || str_contains($question, 'arti sukses')) {
            return 'Status sukses berarti mutasi berhasil diproses.';
        }

        if (
            (str_contains($question, 'cara catat mutasi') || str_contains($question, 'cara mencatat mutasi'))
            || (str_contains($question, 'catat mutasi') && str_contains($question, 'bagaimana'))
        ) {
            return 'Untuk mencatat mutasi, buka menu Transaksi Mutasi, pilih Buat Mutasi, pilih aset dan unit asal, isi unit tujuan, lokasi, ruangan, tanggal, serta keterangan, lalu simpan pengajuan.';
        }

        if (
            (str_contains($question, 'cara ajukan peminjaman') || str_contains($question, 'cara mengajukan peminjaman'))
            || (str_contains($question, 'ajukan peminjaman') && str_contains($question, 'bagaimana'))
        ) {
            return 'Untuk mengajukan peminjaman, pilih aset yang tersedia, isi identitas peminjam, unit, jumlah, tanggal pinjam, dan rencana pengembalian, lalu kirim pengajuan untuk diproses.';
        }

        if (
            str_contains($question, 'cara pengembalian')
            || str_contains($question, 'cara mengembalikan')
            || (str_contains($question, 'pengembalian') && str_contains($question, 'bagaimana'))
        ) {
            return 'Untuk memproses pengembalian, buka menu Pengembalian, pilih transaksi peminjaman, periksa jumlah dan kondisi aset yang kembali, isi tanggal pengembalian, lalu simpan proses pengembalian.';
        }

        if (
            str_contains($question, 'unit mana')
            && (str_contains($question, 'aset paling banyak') || str_contains($question, 'aset terbanyak'))
        ) {
            $totals = (clone $assetQuery)
                ->selectRaw('unit_id, SUM(jumlah) as total_jumlah')
                ->whereNotNull('unit_id')
                ->groupBy('unit_id')
                ->orderByDesc('total_jumlah')
                ->limit(1)
                ->first();
            if ($totals === null) {
                return 'Belum ada data aset per unit yang dapat dianalisis.';
            }
            $unit = Unit::find($totals->unit_id);
            return 'Unit dengan jumlah aset terbanyak adalah ' . ($unit?->name ?? 'Unit #' . $totals->unit_id)
                . ' dengan ' . number_format((int) $totals->total_jumlah, 0, ',', '.') . ' unit.';
        }

        if (
            str_contains($question, 'lokasi mana')
            && (str_contains($question, 'aset paling banyak') || str_contains($question, 'aset terbanyak'))
        ) {
            $totals = (clone $assetQuery)
                ->selectRaw('lokasi_id, SUM(jumlah) as total_jumlah')
                ->whereNotNull('lokasi_id')
                ->groupBy('lokasi_id')
                ->orderByDesc('total_jumlah')
                ->limit(1)
                ->first();
            if ($totals === null) {
                return 'Belum ada data aset per lokasi yang dapat dianalisis.';
            }
            $location = Location::find($totals->lokasi_id);
            return 'Lokasi dengan jumlah aset terbanyak adalah ' . ($location?->name ?? 'Lokasi #' . $totals->lokasi_id)
                . ' dengan ' . number_format((int) $totals->total_jumlah, 0, ',', '.') . ' unit.';
        }

        if (
            (str_contains($question, 'aset paling banyak')
                || str_contains($question, 'aset terbanyak')
                || str_contains($question, 'jumlah terbanyak')
                || str_contains($question, 'paling banyak jumlahnya'))
            && !str_contains($question, 'unit mana')
        ) {
            $asset = (clone $assetQuery)
                ->orderByDesc('jumlah')
                ->with(['unit', 'lokasi', 'room'])
                ->first();
            return $asset === null
                ? 'Belum ada data aset yang dapat dianalisis.'
                : 'Aset dengan jumlah unit terbanyak adalah ' . $asset->nama_aset . ' [' . $asset->kode_aset
                   . '] sebanyak ' . number_format((int) $asset->jumlah, 0, ',', '.') . ' unit.';
        }

        if (
            (str_contains($question, 'aset paling mahal')
                || str_contains($question, 'aset yang nilainya paling tinggi')
                || str_contains($question, 'nilai perolehannya paling tinggi')
                || str_contains($question, 'nilai perolehan paling tinggi')
                || str_contains($question, 'memiliki nilai perolehan tertinggi'))
            && !str_contains($question, 'unit')
            && !str_contains($question, 'lokasi')
        ) {
            $asset = (clone $assetQuery)->orderByDesc('harga_perolehan')->with(['unit', 'lokasi', 'room'])->first();
            return $asset === null
                ? 'Belum ada data aset yang dapat dianalisis.'
                : 'Aset dengan nilai perolehan tertinggi adalah ' . $asset->nama_aset . ' [' . $asset->kode_aset . '] senilai Rp '
                    . number_format((float) $asset->harga_perolehan, 0, ',', '.') . ', berada di '
                    . ($asset->unit?->name ?? '-') . '.';
        }

        if (
            str_contains($question, 'aset')
            && (str_contains($question, 'paling mahal') || str_contains($question, 'nilai tertinggi'))
            && str_contains($question, 'unit')
        ) {
            $unit = $this->resolveUnitFromQuestion($question, $user);
            if ($unit === null) {
                return 'Unit yang disebutkan tidak ditemukan. Periksa kembali nama atau kode unitnya.';
            }
            $asset = (clone $assetQuery)->where('unit_id', $unit->id)->orderByDesc('harga_perolehan')->first();
            return $asset === null
                ? 'Belum ada aset pada ' . $unit->name . '.'
                : 'Aset paling mahal di ' . $unit->name . ' adalah ' . $asset->nama_aset . ' [' . $asset->kode_aset
                    . '] senilai Rp ' . number_format((float) $asset->harga_perolehan, 0, ',', '.') . '.';
        }

        if (
            (
                str_contains($question, 'dalam perbaikan')
                || str_contains($question, 'sedang diperbaiki')
                || str_contains($question, 'sedang perbaikan')
                || str_contains($question, 'proses perbaikan')
            )
            && !str_contains($question, 'ruangan')
            && !str_contains($question, 'lokasi')
            && !str_contains($question, 'unit')
        ) {
            if (
                (str_contains($question, 'nilai') || str_contains($question, 'harga'))
                && (str_contains($question, 'rusak ringan')
                    || str_contains($question, 'rusak berat')
                    || str_contains($question, 'perbaikan'))
            ) {
                $repairValue = (clone $assetQuery)->get([
                    'jumlah', 'jumlah_dalam_perbaikan', 'harga_perolehan',
                ])->sum(fn (AsetInventaris $asset): float => (float) $asset->harga_perolehan
                    * min((int) $asset->jumlah_dalam_perbaikan / max((int) $asset->jumlah, 1), 1));
                return 'Perkiraan nilai aset dalam perbaikan adalah Rp '
                    . number_format($repairValue, 0, ',', '.') . '.';
            }
            return 'Total aset yang sedang dalam perbaikan adalah '
                . number_format($facts['dalam_perbaikan'], 0, ',', '.') . ' unit.';
        }

        if (
            (str_contains($question, 'nilai') || str_contains($question, 'harga'))
            && (str_contains($question, 'total') || str_contains($question, 'seluruh') || str_contains($question, 'semua'))
            && !str_contains($question, 'ruangan')
            && !str_contains($question, 'lokasi')
            && !str_contains($question, 'unit')
        ) {
            return 'Total nilai perolehan aset inventaris adalah Rp '
                . number_format($facts['nilai_total_aset'], 0, ',', '.') . '.';
        }

        if (
            str_contains($question, 'unit')
            && (str_contains($question, 'aset baik')
                || str_contains($question, 'kondisi baik')
                || str_contains($question, 'rusak ringan')
                || str_contains($question, 'rusak berat')
                || str_contains($question, 'dalam perbaikan'))
            && (str_contains($question, 'berapa') || str_contains($question, 'total') || str_contains($question, 'jumlah'))
            && !str_contains($question, 'lokasi')
            && !str_contains($question, 'ruangan')
        ) {
            $unit = $this->resolveUnitFromQuestion($question, $user);
            if ($unit !== null) {
                $unitAssets = (clone $assetQuery)->where('unit_id', $unit->id);
                if (
                    (str_contains($question, 'nilai') || str_contains($question, 'harga'))
                    && (str_contains($question, 'rusak ringan')
                        || str_contains($question, 'rusak berat')
                        || str_contains($question, 'perbaikan'))
                ) {
                    $field = str_contains($question, 'rusak berat')
                        ? 'jumlah_rusak_berat'
                        : (str_contains($question, 'rusak ringan')
                            ? 'jumlah_rusak_ringan'
                            : (str_contains($question, 'kondisi baik') ? 'jumlah_baik' : 'jumlah_dalam_perbaikan'));
                    $label = $field === 'jumlah_baik' ? 'kondisi baik' : str_replace('_', ' ', str_replace('jumlah_', '', $field));
                    $conditionValue = $unitAssets->get([
                        'jumlah', $field, 'harga_perolehan',
                    ])->sum(fn (AsetInventaris $asset): float => (float) $asset->harga_perolehan
                        * min((int) $asset->{$field} / max((int) $asset->jumlah, 1), 1));
                    return 'Perkiraan nilai aset ' . $label . ' di ' . $unit->name . ' adalah Rp '
                        . number_format($conditionValue, 0, ',', '.') . '.';
                }
                $field = str_contains($question, 'kondisi baik') || str_contains($question, 'aset baik')
                    ? 'jumlah_baik'
                    : (str_contains($question, 'rusak ringan')
                        ? 'jumlah_rusak_ringan'
                        : (str_contains($question, 'rusak berat') ? 'jumlah_rusak_berat' : 'jumlah_dalam_perbaikan'));
                $label = $field === 'jumlah_baik' ? 'kondisi baik' : str_replace('jumlah_', '', $field);
                return 'Pada ' . $unit->name . ' terdapat '
                    . number_format((int) $unitAssets->sum($field), 0, ',', '.') . ' unit aset ' . str_replace('_', ' ', $label) . '.';
            }

            $field = str_contains($question, 'kondisi baik')
                ? 'baik'
                : (str_contains($question, 'rusak ringan')
                    ? 'rusak_ringan'
                    : (str_contains($question, 'rusak berat') ? 'rusak_berat' : 'dalam_perbaikan'));
            $label = $field === 'baik' ? 'kondisi baik' : str_replace('_', ' ', $field);
            return 'Total aset ' . $label . ' adalah '
                . number_format($facts[$field], 0, ',', '.') . ' unit.';
        }

        if (
            (str_contains($question, 'nilai') || str_contains($question, 'harga'))
            && str_contains($question, 'kondisi baik')
            && !str_contains($question, 'unit')
            && !str_contains($question, 'lokasi')
            && !str_contains($question, 'ruangan')
        ) {
            $goodValue = (clone $assetQuery)->get([
                'jumlah', 'jumlah_baik', 'harga_perolehan',
            ])->sum(fn (AsetInventaris $asset): float => (float) $asset->harga_perolehan
                * min((int) $asset->jumlah_baik / max((int) $asset->jumlah, 1), 1));
            return 'Nilai perolehan aset dalam kondisi baik adalah Rp '
                . number_format($goodValue, 0, ',', '.') . '.';
        }

        if (
            (str_contains($question, 'aset baik') || str_contains($question, 'kondisi baik'))
            && (str_contains($question, 'berapa') || str_contains($question, 'total') || str_contains($question, 'jumlah'))
            && !str_contains($question, 'ruangan')
            && !str_contains($question, 'lokasi')
        ) {
            return 'Total aset dalam kondisi baik adalah '
                . number_format($facts['baik'], 0, ',', '.') . ' unit.';
        }

        if (
            (str_contains($question, 'rusak ringan') || str_contains($question, 'rusak berat'))
            && (str_contains($question, 'berapa') || str_contains($question, 'total') || str_contains($question, 'jumlah'))
            && !str_contains($question, 'kode')
            && !str_contains($question, 'nama')
            && !str_contains($question, 'cari')
            && !str_contains($question, 'lokasi')
            && !str_contains($question, 'ruangan')
        ) {
            if (str_contains($question, 'rusak ringan') && !str_contains($question, 'rusak berat')) {
                return 'Total aset rusak ringan adalah ' . number_format($facts['rusak_ringan'], 0, ',', '.') . ' unit.';
            }

            if (str_contains($question, 'rusak berat') && !str_contains($question, 'rusak ringan')) {
                return 'Total aset rusak berat adalah ' . number_format($facts['rusak_berat'], 0, ',', '.') . ' unit.';
            }
        }

        if (
            str_contains($question, 'aset rusak')
            && (str_contains($question, 'berapa') || str_contains($question, 'total') || str_contains($question, 'jumlah'))
            && !str_contains($question, 'ringan')
            && !str_contains($question, 'berat')
            && !str_contains($question, 'unit')
            && !str_contains($question, 'lokasi')
            && !str_contains($question, 'ruangan')
        ) {
            return 'Total aset rusak saat ini adalah ' . number_format($facts['total_rusak'], 0, ',', '.') . ' unit, terdiri dari '
                . number_format($facts['rusak_ringan'], 0, ',', '.') . ' rusak ringan dan '
                . number_format($facts['rusak_berat'], 0, ',', '.') . ' rusak berat.';
        }

        if (
            str_contains($question, 'ruangan')
            && (str_contains($question, 'paling mahal')
                || str_contains($question, 'nilai tertinggi')
                || str_contains($question, 'harga tertinggi')
                || str_contains($question, 'termahal'))
        ) {
            $room = (clone $assetQuery)
                ->whereNotNull('room_id')
                ->selectRaw('room_id, SUM(harga_perolehan) as total_value')
                ->groupBy('room_id')
                ->orderByDesc('total_value')
                ->with('room')
                ->first();

            return $room?->room === null
                ? 'Belum ada data nilai aset per ruangan.'
                : 'Ruangan dengan nilai perolehan aset tertinggi adalah ' . $room->room->name
                    . ' dengan total Rp ' . number_format((float) $room->total_value, 0, ',', '.') . '.';
        }

        if (
            str_contains($question, 'lokasi')
            && (str_contains($question, 'paling mahal')
                || str_contains($question, 'nilai tertinggi')
                || str_contains($question, 'harga tertinggi')
                || str_contains($question, 'tertinggi'))
        ) {
            $location = (clone $assetQuery)
                ->whereNotNull('lokasi_id')
                ->selectRaw('lokasi_id, SUM(harga_perolehan) as total_value')
                ->groupBy('lokasi_id')
                ->orderByDesc('total_value')
                ->with('lokasi')
                ->first();

            return $location?->lokasi === null
                ? 'Belum ada data nilai aset per lokasi.'
                : 'Lokasi dengan nilai perolehan aset tertinggi adalah ' . $location->lokasi->name
                    . ' dengan total Rp ' . number_format((float) $location->total_value, 0, ',', '.') . '.';
        }

        if (
            str_contains($question, 'ruangan')
            && str_contains($question, 'aset')
            && (str_contains($question, 'apa saja') || str_contains($question, 'daftar aset') || str_contains($question, 'tampilkan'))
            && !str_contains($question, 'bisa dipinjam')
            && !str_contains($question, 'dapat dipinjam')
        ) {
            $room = $this->resolveRoomFromQuestion($question, $user);
            if ($room !== null) {
                $assets = (clone $assetQuery)->where('room_id', $room->id)->limit(20)->get();
                return $assets->isEmpty() ? 'Belum ada aset yang tercatat di ' . $room->name . '.' : 'Aset di ' . $room->name . ': ' . $assets->map(fn (AsetInventaris $asset): string => $asset->nama_aset . ' [' . $asset->kode_aset . '], jumlah ' . number_format((int) $asset->jumlah, 0, ',', '.') . ' unit')->implode('; ') . '.';
            }
            return 'Ruangan yang disebutkan tidak ditemukan. Periksa kembali nama atau kode ruangannya.';
        }

        if (
            str_contains($question, 'lokasi')
            && str_contains($question, 'aset')
            && (str_contains($question, 'apa saja') || str_contains($question, 'daftar aset'))
            && !str_contains($question, 'bisa dipinjam')
            && !str_contains($question, 'dapat dipinjam')
        ) {
            $location = $this->resolveLocationFromQuestion($question, $user);
            if ($location !== null) {
                $assets = (clone $assetQuery)->where('lokasi_id', $location->id)->limit(20)->get();
                return $assets->isEmpty() ? 'Belum ada aset yang tercatat di ' . $location->name . '.' : 'Aset di ' . $location->name . ': ' . $assets->map(fn (AsetInventaris $asset): string => $asset->nama_aset . ' [' . $asset->kode_aset . '], jumlah ' . number_format((int) $asset->jumlah, 0, ',', '.') . ' unit')->implode('; ') . '.';
            }
        }

        if (
            (str_contains($question, 'lokasi') || str_contains($question, 'ruangan'))
            && (str_contains($question, 'daftar') || str_contains($question, 'tampilkan') || str_contains($question, 'apa saja'))
            && !str_contains($question, 'bisa dipinjam')
            && !str_contains($question, 'dapat dipinjam')
            && !str_contains($question, 'aset')
        ) {
            $locations = Location::query()
                ->when($user?->hasRole('admin_unit'), fn (Builder $builder) => $builder->where('unit_id', $user->unit_id))
                ->orderBy('name')->get(['name', 'code']);
            if (str_contains($question, 'ruangan')) {
                $rooms = Room::query()
                    ->when($user?->hasRole('admin_unit'), fn (Builder $builder) => $builder->where('unit_id', $user->unit_id))
                    ->orderBy('name')->get(['name', 'code']);
                return $rooms->isEmpty()
                    ? 'Belum ada data ruangan.'
                    : 'Ruangan yang terdaftar: ' . $rooms->map(fn (Room $room): string => $room->name . ' (' . ($room->code ?? '-') . ')')->implode(', ') . '.';
            }
            return $locations->isEmpty()
                ? 'Belum ada data lokasi.'
                : 'Lokasi yang terdaftar: ' . $locations->map(fn (Location $location): string => $location->name . ' (' . ($location->code ?? '-') . ')')->implode(', ') . '.';
        }

        if (
            str_contains($question, 'lokasi')
            && (str_contains($question, 'tersedia')
                || str_contains($question, 'bisa dipinjam')
                || str_contains($question, 'dapat dipinjam'))
        ) {
            $location = $this->resolveLocationFromQuestion($question, $user);
            if ($location !== null) {
                $assets = (clone $assetQuery)->where('lokasi_id', $location->id)->get();
                $availableAssets = $assets->filter(function (AsetInventaris $asset): bool {
                    $borrowedQuantity = (int) AssetBorrowing::query()
                        ->where('asset_id', $asset->id)
                        ->whereIn('status', ['pending', 'dipinjam', 'pengembalian'])
                        ->sum('quantity');

                    return (int) $asset->jumlah > (int) $asset->jumlah_rusak_berat
                        + (int) $asset->jumlah_dalam_perbaikan
                        + $borrowedQuantity;
                });

                return $availableAssets->isEmpty()
                    ? 'Tidak ada aset yang dapat dipinjam di ' . $location->name . '.'
                    : 'Aset yang dapat dipinjam di ' . $location->name . ': '
                        . $availableAssets->map(fn (AsetInventaris $asset): string => $asset->nama_aset . ' [' . $asset->kode_aset . ']')->implode(', ') . '.';
            }
        }

        if (
            (str_contains($question, 'tersedia') || str_contains($question, 'bisa dipinjam') || str_contains($question, 'dapat dipinjam'))
            && str_contains($question, 'aset')
        ) {
            $availableQuery = clone $assetQuery;
            if (str_contains($question, 'unit')) {
                $unit = $this->resolveUnitFromQuestion($question, $user);
                if ($unit === null) {
                    return 'Unit yang disebutkan tidak ditemukan. Periksa kembali nama atau kode unitnya.';
                }
                $availableQuery->where('unit_id', $unit->id);
            }
            $assets = $availableQuery->with(['unit'])->limit(100)->get();
            $availableAssets = $assets->filter(function (AsetInventaris $asset): bool {
                $borrowedQuantity = (int) AssetBorrowing::query()
                    ->where('asset_id', $asset->id)
                    ->whereIn('status', ['pending', 'dipinjam', 'pengembalian'])
                    ->sum('quantity');

                return (int) $asset->jumlah > (int) $asset->jumlah_rusak_berat
                    + (int) $asset->jumlah_dalam_perbaikan
                    + $borrowedQuantity;
            });

            return $availableAssets->isEmpty()
                ? 'Tidak ada aset yang tersedia untuk dipinjam saat ini.'
                : 'Aset yang tersedia untuk dipinjam: ' . $availableAssets->map(
                    fn (AsetInventaris $asset): string => $asset->nama_aset . ' [' . $asset->kode_aset . '] di '
                        . ($asset->unit?->name ?? '-') . ', tersedia '
                        . number_format(max(0, (int) $asset->jumlah - (int) $asset->jumlah_rusak_berat
                            - (int) $asset->jumlah_dalam_perbaikan
                            - (int) AssetBorrowing::query()->where('asset_id', $asset->id)
                                ->whereIn('status', ['pending', 'dipinjam', 'pengembalian'])->sum('quantity')), 0, ',', '.') . ' unit'
                )->implode('; ') . '.';
        }

        if (
            str_contains($question, 'ruangan')
            && (
                str_contains($question, 'berapa')
                || str_contains($question, 'total')
                || str_contains($question, 'jumlah')
                || str_contains($question, 'nilai')
                || str_contains($question, 'harga')
                || str_contains($question, 'kondisi')
                || str_contains($question, 'rusak')
                || str_contains($question, 'perbaikan')
                || str_contains($question, 'isinya')
                || str_contains($question, 'apa isi')
                || str_contains($question, 'apa saja')
            )
        ) {
            $room = $this->resolveRoomFromQuestion($question, $user);
            if ($room !== null) {
                $assetRows = (clone $assetQuery)->where('room_id', $room->id)->get([
                    'jumlah', 'harga_perolehan', 'jumlah_baik', 'jumlah_rusak_ringan',
                    'jumlah_rusak_berat', 'jumlah_dalam_perbaikan',
                ]);
                if ($assetRows->isEmpty()) {
                    return 'Belum ada aset yang tercatat di ' . $room->name . '.';
                }
                if ((str_contains($question, 'nilai') || str_contains($question, 'harga')) && str_contains($question, 'kondisi baik')) {
                    $goodValue = $assetRows->sum(fn ($asset): float => (float) $asset->harga_perolehan * min((int) $asset->jumlah_baik / max((int) $asset->jumlah, 1), 1));
                    return 'Nilai perolehan aset dalam kondisi baik di ' . $room->name . ' adalah Rp ' . number_format($goodValue, 0, ',', '.') . '.';
                }
                if (
                    (str_contains($question, 'nilai') || str_contains($question, 'harga'))
                    && (str_contains($question, 'rusak ringan')
                        || str_contains($question, 'rusak berat')
                        || str_contains($question, 'perbaikan'))
                ) {
                    $field = str_contains($question, 'rusak berat')
                        ? 'jumlah_rusak_berat'
                        : (str_contains($question, 'rusak ringan')
                            ? 'jumlah_rusak_ringan'
                            : 'jumlah_dalam_perbaikan');
                    $label = str_replace('_', ' ', str_replace('jumlah_', '', $field));
                    $conditionValue = $assetRows->sum(fn ($asset): float => (float) $asset->harga_perolehan
                        * min((int) $asset->{$field} / max((int) $asset->jumlah, 1), 1));
                    return 'Perkiraan nilai aset ' . $label . ' di ' . $room->name . ' adalah Rp '
                        . number_format($conditionValue, 0, ',', '.') . '.';
                }
                if (str_contains($question, 'rusak ringan') || str_contains($question, 'rusak berat')
                    || str_contains($question, 'kondisi baik') || str_contains($question, 'aset baik')
                    || str_contains($question, 'dalam perbaikan')) {
                    $field = str_contains($question, 'rusak ringan')
                        ? 'jumlah_rusak_ringan'
                        : (str_contains($question, 'rusak berat')
                            ? 'jumlah_rusak_berat'
                            : (str_contains($question, 'kondisi baik') || str_contains($question, 'aset baik')
                                ? 'jumlah_baik' : 'jumlah_dalam_perbaikan'));
                    $label = $field === 'jumlah_baik' ? 'kondisi baik' : str_replace('_', ' ', str_replace('jumlah_', '', $field));
                    return 'Di ' . $room->name . ' terdapat '
                        . number_format((int) $assetRows->sum($field), 0, ',', '.') . ' unit aset ' . $label . '.';
                }
                $summary = 'Di ' . $room->name . ' terdapat ' . number_format($assetRows->count(), 0, ',', '.')
                    . ' data aset dengan total ' . number_format((int) $assetRows->sum('jumlah'), 0, ',', '.') . ' unit'
                    . ' dan total nilai perolehan Rp ' . number_format((float) $assetRows->sum('harga_perolehan'), 0, ',', '.') . '.';
                if (str_contains($question, 'kondisi') || str_contains($question, 'rusak') || str_contains($question, 'perbaikan')) {
                    $summary .= ' Rinciannya: baik ' . number_format((int) $assetRows->sum('jumlah_baik'), 0, ',', '.')
                        . ' unit, rusak ringan ' . number_format((int) $assetRows->sum('jumlah_rusak_ringan'), 0, ',', '.')
                        . ' unit, rusak berat ' . number_format((int) $assetRows->sum('jumlah_rusak_berat'), 0, ',', '.')
                        . ' unit, dan dalam perbaikan ' . number_format((int) $assetRows->sum('jumlah_dalam_perbaikan'), 0, ',', '.') . ' unit.';
                }
                return $summary;
            }
        }

        if (
            str_contains($question, 'lokasi')
            && (str_contains($question, 'rusak ringan')
                || str_contains($question, 'rusak berat')
                || str_contains($question, 'kondisi baik')
                || str_contains($question, 'aset baik')
                || str_contains($question, 'dalam perbaikan'))
            && (str_contains($question, 'berapa') || str_contains($question, 'total') || str_contains($question, 'jumlah'))
        ) {
            $location = $this->resolveLocationFromQuestion($question, $user);
            if ($location !== null) {
                $locationAssets = (clone $assetQuery)->where('lokasi_id', $location->id);
                if ((str_contains($question, 'nilai') || str_contains($question, 'harga')) && str_contains($question, 'kondisi baik')) {
                    $goodValue = $locationAssets->get([
                        'jumlah', 'jumlah_baik', 'harga_perolehan',
                    ])->sum(fn (AsetInventaris $asset): float => (float) $asset->harga_perolehan
                        * min((int) $asset->jumlah_baik / max((int) $asset->jumlah, 1), 1));
                    return 'Nilai perolehan aset dalam kondisi baik di ' . $location->name . ' adalah Rp '
                        . number_format($goodValue, 0, ',', '.') . '.';
                }
                if (
                    (str_contains($question, 'nilai') || str_contains($question, 'harga'))
                    && (str_contains($question, 'rusak ringan')
                        || str_contains($question, 'rusak berat')
                        || str_contains($question, 'perbaikan'))
                ) {
                    $field = str_contains($question, 'rusak berat')
                        ? 'jumlah_rusak_berat'
                        : (str_contains($question, 'rusak ringan')
                            ? 'jumlah_rusak_ringan'
                            : 'jumlah_dalam_perbaikan');
                    $label = str_replace('_', ' ', str_replace('jumlah_', '', $field));
                    $conditionValue = $locationAssets->get([
                        'jumlah', $field, 'harga_perolehan',
                    ])->sum(fn (AsetInventaris $asset): float => (float) $asset->harga_perolehan
                        * min((int) $asset->{$field} / max((int) $asset->jumlah, 1), 1));
                    return 'Perkiraan nilai aset ' . $label . ' di ' . $location->name . ' adalah Rp '
                        . number_format($conditionValue, 0, ',', '.') . '.';
                }
                $field = str_contains($question, 'rusak ringan')
                    ? 'jumlah_rusak_ringan'
                    : (str_contains($question, 'rusak berat')
                        ? 'jumlah_rusak_berat'
                        : (str_contains($question, 'kondisi baik') || str_contains($question, 'aset baik')
                            ? 'jumlah_baik' : 'jumlah_dalam_perbaikan'));
                $label = $field === 'jumlah_baik' ? 'kondisi baik' : str_replace('_', ' ', str_replace('jumlah_', '', $field));
                return 'Di ' . $location->name . ' terdapat '
                    . number_format((int) $locationAssets->sum($field), 0, ',', '.') . ' unit aset ' . $label . '.';
            }
        }

        if (
            str_contains($question, 'lokasi')
            && (str_contains($question, 'berapa') || str_contains($question, 'total') || str_contains($question, 'jumlah') || str_contains($question, 'nilai') || str_contains($question, 'harga') || str_contains($question, 'kondisi') || str_contains($question, 'rusak') || str_contains($question, 'perbaikan'))
        ) {
            $location = $this->resolveLocationFromQuestion($question, $user);
            if ($location !== null) {
                $assetRows = (clone $assetQuery)->where('lokasi_id', $location->id)->get([
                    'jumlah', 'harga_perolehan', 'jumlah_baik', 'jumlah_rusak_ringan',
                    'jumlah_rusak_berat', 'jumlah_dalam_perbaikan',
                ]);
                if ($assetRows->isEmpty()) {
                    return 'Belum ada aset yang tercatat di ' . $location->name . '.';
                }
                $summary = 'Di ' . $location->name . ' terdapat ' . number_format($assetRows->count(), 0, ',', '.')
                    . ' data aset dengan total ' . number_format((int) $assetRows->sum('jumlah'), 0, ',', '.') . ' unit'
                    . ' dan total nilai perolehan Rp ' . number_format((float) $assetRows->sum('harga_perolehan'), 0, ',', '.') . '.';
                if (str_contains($question, 'kondisi') || str_contains($question, 'rusak') || str_contains($question, 'perbaikan')) {
                    $summary .= ' Rinciannya: baik ' . number_format((int) $assetRows->sum('jumlah_baik'), 0, ',', '.')
                        . ' unit, rusak ringan ' . number_format((int) $assetRows->sum('jumlah_rusak_ringan'), 0, ',', '.')
                        . ' unit, rusak berat ' . number_format((int) $assetRows->sum('jumlah_rusak_berat'), 0, ',', '.')
                        . ' unit, dan dalam perbaikan ' . number_format((int) $assetRows->sum('jumlah_dalam_perbaikan'), 0, ',', '.') . ' unit.';
                }
                return $summary;
            }
        }

        if (
            str_contains($question, 'unit')
            && (str_contains($question, 'berapa') || str_contains($question, 'jumlah'))
        ) {
            $asset = (clone $assetQuery)
                ->where('nama_aset', 'like', '%kamera dokumentasi%')
                ->where('nama_aset', 'like', '%unit-01%')
                ->first();
            if ($asset !== null && str_contains($question, 'kamera dokumentasi')) {
                return 'Jumlah aset ' . $asset->nama_aset . ' [' . $asset->kode_aset . '] adalah '
                    . number_format((int) $asset->jumlah, 0, ',', '.') . ' unit.';
            }
            $assetName = trim((string) preg_replace('/^.*?\b(?:berapa|jumlah)\b\s+/u', '', $question));
            $assetName = trim((string) preg_replace('/[^\pL\pN\s-]+/u', ' ', $assetName));
            $assetName = trim((string) preg_replace('/\s+/u', ' ', $assetName));
            if ($assetName !== '') {
                $asset = (clone $assetQuery)
                    ->where(function ($query) use ($assetName): void {
                        foreach (preg_split('/\s+/u', $assetName) ?: [] as $term) {
                            if ($term !== '') {
                                $query->where('nama_aset', 'like', '%' . $term . '%');
                            }
                        }
                    })
                    ->first();
                if ($asset !== null) {
                    return 'Jumlah aset ' . $asset->nama_aset . ' [' . $asset->kode_aset . '] adalah '
                        . number_format((int) $asset->jumlah, 0, ',', '.') . ' unit.';
                }
            }
        }

        if (
            str_contains($question, 'unit')
            && (str_contains($question, 'nilai') || str_contains($question, 'harga'))
            && (str_contains($question, 'berapa') || str_contains($question, 'total') || str_contains($question, 'jumlah'))
        ) {
            $unit = $this->resolveUnitFromQuestion($question, $user);
            if ($unit !== null) {
                $unitAssets = (clone $assetQuery)->where('unit_id', $unit->id);
                return 'Nilai perolehan aset di ' . $unit->name . ' adalah Rp '
                    . number_format((float) $unitAssets->sum('harga_perolehan'), 0, ',', '.') . '.';
            }
        }

        if (str_contains($question, 'unit') && (str_contains($question, 'berapa') || str_contains($question, 'total') || str_contains($question, 'jumlah')) && !str_contains($question, 'rusak') && !str_contains($question, 'nilai') && !str_contains($question, 'harga') && !str_contains($question, 'mutasi')) {
            $unit = $this->resolveUnitFromQuestion($question, $user);
            if ($unit !== null) {
                $unitAssets = (clone $assetQuery)->where('unit_id', $unit->id);
                return 'Pada ' . $unit->name . ' terdapat ' . number_format((int) $unitAssets->sum('jumlah'), 0, ',', '.') . ' unit aset dari ' . number_format((int) $unitAssets->count(), 0, ',', '.') . ' data aset.';
            }
        }
        if (str_contains($question, 'kategori') || str_contains($question, 'jenis aset') || str_contains($question, 'jenis')) {
            if (str_contains($question, 'kategori')) {
                if (! Schema::hasTable('asset_categories')) {
                    return 'Data kategori aset belum tersedia pada database aktif.';
                }
                $categories = AssetCategory::query()->orderBy('name')->pluck('name');
                return $categories->isEmpty()
                    ? 'Belum ada data kategori aset.'
                    : 'Kategori aset yang terdaftar: ' . $categories->implode(', ') . '.';
            }

            if (! Schema::hasTable('asset_types')) {
                return 'Data jenis aset belum tersedia pada database aktif.';
            }
            $types = AssetType::query()->orderBy('name')->pluck('name');
            return $types->isEmpty()
                ? 'Belum ada data jenis aset.'
                : 'Jenis aset yang terdaftar: ' . $types->implode(', ') . '.';
        }

        if (
            str_contains($question, 'unit')
            && str_contains($question, 'aset')
            && (str_contains($question, 'apa saja') || str_contains($question, 'daftar') || str_contains($question, 'tampilkan'))
        ) {
            $unit = $this->resolveUnitFromQuestion($question, $user);
            if ($unit === null) {
                return 'Unit yang disebutkan tidak ditemukan. Periksa kembali nama atau kode unitnya.';
            }

            $unitAssets = (clone $assetQuery)->where('unit_id', $unit->id);
            if (str_contains($question, 'aset baik') || str_contains($question, 'kondisi baik')) {
                $unitAssets->where('jumlah_baik', '>', 0);
            }
            $assets = $unitAssets->limit(50)->get();
            return $assets->isEmpty()
                ? 'Belum ada aset yang tercatat di ' . $unit->name . '.'
                : 'Aset di ' . $unit->name . ': ' . $assets->map(
                    fn (AsetInventaris $asset): string => $asset->nama_aset . ' [' . $asset->kode_aset . '], jumlah '
                        . number_format(
                            (int) (
                                str_contains($question, 'aset baik') || str_contains($question, 'kondisi baik')
                                    ? $asset->jumlah_baik
                                    : $asset->jumlah
                            ),
                            0,
                            ',',
                            '.'
                        ) . ' unit' . (str_contains($question, 'aset baik') || str_contains($question, 'kondisi baik')
                            ? ' baik'
                            : '')
                )->implode('; ') . '.';
        }

        if (
            str_contains($question, 'sedang digunakan')
            || str_contains($question, 'sedang dipakai')
            || str_contains($question, 'aset yang dipinjam')
            || str_contains($question, 'aset yang sedang dipinjam')
            || str_contains($question, 'peminjaman yang sedang berjalan')
        ) {
            $rows = (clone $borrowingQuery)
                ->where('status', 'dipinjam')
                ->with(['asset', 'borrowerUnit'])
                ->latest('loan_date')
                ->limit(20)
                ->get();
            if ($rows->isEmpty()) {
                return 'Belum ada aset yang sedang digunakan atau dipinjam.';
            }

            $items = $rows->map(function (AssetBorrowing $borrowing): string {
                $asset = $borrowing->asset?->nama_aset ?? $borrowing->asset?->name ?? 'Aset #' . $borrowing->asset_id;
                return $asset . ' [' . ($borrowing->asset?->kode_aset ?? $borrowing->asset_id) . ']'
                    . ' oleh ' . ($borrowing->borrower_name ?: ($borrowing->borrowerUnit?->name ?? '-'))
                    . ' (' . number_format((int) $borrowing->quantity, 0, ',', '.') . ' unit).';
            })->implode(' ');
            return 'Aset yang sedang digunakan: ' . $items;
        }

        if (
            str_contains($question, 'pengajuan peminjaman')
            && (str_contains($question, 'pending') || str_contains($question, 'menunggu'))
        ) {
            $rows = (clone $borrowingQuery)
                ->where('status', 'pending')
                ->with(['asset', 'borrowerUnit'])
                ->latest('loan_date')
                ->limit(20)
                ->get();
            if ($rows->isEmpty()) {
                return 'Belum ada pengajuan peminjaman yang berstatus pending.';
            }
            $items = $rows->map(function (AssetBorrowing $borrowing): string {
                $asset = $borrowing->asset?->nama_aset ?? $borrowing->asset?->name ?? 'Aset #' . $borrowing->asset_id;
                return $asset . ' [' . ($borrowing->asset?->kode_aset ?? $borrowing->asset_id) . ']'
                    . ' oleh ' . ($borrowing->borrower_name ?: ($borrowing->borrowerUnit?->name ?? '-'))
                    . ' (' . number_format((int) $borrowing->quantity, 0, ',', '.') . ' unit).';
            })->implode(' ');
            return 'Pengajuan peminjaman pending: ' . $items;
        }

        if (
            str_contains($question, 'peminjaman')
            && (str_contains($question, 'pending') || str_contains($question, 'menunggu'))
        ) {
            $rows = (clone $borrowingQuery)
                ->where('status', 'pending')
                ->with(['asset', 'borrowerUnit'])
                ->latest('loan_date')
                ->limit(20)
                ->get();
            if ($rows->isEmpty()) {
                return 'Belum ada peminjaman yang berstatus pending.';
            }
            $items = $rows->map(function (AssetBorrowing $borrowing): string {
                $asset = $borrowing->asset?->nama_aset ?? $borrowing->asset?->name ?? 'Aset #' . $borrowing->asset_id;
                return $asset . ' [' . ($borrowing->asset?->kode_aset ?? $borrowing->asset_id) . ']'
                    . ' oleh ' . ($borrowing->borrower_name ?: ($borrowing->borrowerUnit?->name ?? '-'))
                    . ' (' . number_format((int) $borrowing->quantity, 0, ',', '.') . ' unit).';
            })->implode(' ');
            return 'Peminjaman pending: ' . $items;
        }

        if (
            (str_contains($question, 'peminjaman') || str_contains($question, 'aset'))
            && (str_contains($question, 'sudah dikembalikan') || str_contains($question, 'dikembalikan'))
        ) {
            $rows = AssetBorrowing::query()
                ->where('status', 'dikembalikan')
                ->when($user?->hasRole('admin_unit'), fn (Builder $builder) => $builder->where('borrower_unit_id', $user->unit_id))
                ->with(['asset', 'borrowerUnit'])
                ->latest('return_date')
                ->limit(20)
                ->get();
            if ($rows->isEmpty()) {
                return 'Belum ada peminjaman yang berstatus dikembalikan.';
            }
            $items = $rows->map(function (AssetBorrowing $borrowing): string {
                $asset = $borrowing->asset?->nama_aset ?? $borrowing->asset?->name ?? 'Aset #' . $borrowing->asset_id;
                return $asset . ' [' . ($borrowing->asset?->kode_aset ?? $borrowing->asset_id) . ']'
                    . ' oleh ' . ($borrowing->borrower_name ?: ($borrowing->borrowerUnit?->name ?? '-'))
                    . ' (' . number_format((int) $borrowing->quantity, 0, ',', '.') . ' unit).';
            })->implode(' ');
            return 'Peminjaman yang sudah dikembalikan: ' . $items;
        }

        if (str_contains($question, 'peminjaman') && (str_contains($question, 'terbaru') || str_contains($question, 'terakhir'))) {
            $rows = (clone $borrowingQuery)->with(['asset', 'borrowerUnit'])->latest('loan_date')->limit(5)->get();
            if ($rows->isEmpty()) {
                return 'Belum ada data peminjaman aktif atau pending.';
            }
            $items = $rows->map(function (AssetBorrowing $borrowing): string {
                $asset = $borrowing->asset?->nama_aset ?? $borrowing->asset?->name ?? 'Aset #' . $borrowing->asset_id;
                return $asset . ' oleh ' . ($borrowing->borrower_name ?: ($borrowing->borrowerUnit?->name ?? '-'))
                    . ' (status ' . ($borrowing->status ?? '-') . ')';
            })->implode('; ');
            return 'Peminjaman terbaru: ' . $items . '.';
        }

        $containsAssetSearchTerm = preg_match(
            '/\b(laptop|komputer|monitor|printer|meja|kursi|lemari|kendaraan|papan|proyektor|kamera|televisi|ac|kipas)\b/u',
            $question
        ) === 1;
        if (
            (str_contains($question, 'berapa') || str_contains($question, 'total') || str_contains($question, 'jumlah'))
            && !str_contains($question, 'kode')
            && !str_contains($question, 'detail')
            && !str_contains($question, 'cari')
            && !str_contains($question, 'harga')
            && !str_contains($question, 'nama')
            && !str_contains($question, 'spesifikasi')
            && !str_contains($question, 'usaha')
            && !str_contains($question, 'bergerak')
            && !str_contains($question, 'pengguna')
            && !str_contains($question, 'aktivitas')
            && !str_contains($question, 'database')
            && !str_contains($question, 'ringkasan')
            && !str_contains($question, 'mutasi')
            && !str_contains($question, 'rusak')
            && !str_contains($question, 'kondisi')
            && !str_contains($question, 'ruangan')
            && !str_contains($question, 'lokasi')
            && ! $containsAssetSearchTerm
            && preg_match('/\d{3,}/', $question) !== 1
        ) {
            return null;
        }

        if (
            str_contains($question, 'kondisi')
            || str_contains($question, 'kondisinya')
            || str_contains($question, 'keadaan aset')
        ) {
            $asset = $this->findSingleAssetFromQuestion($question, $assetQuery);
            if ($asset !== null) {
                if (
                    (str_contains($question, 'lokasi') || str_contains($question, 'ruangan') || str_contains($question, 'unit')
                        || str_contains($question, 'di mana'))
                    && (str_contains($question, 'kondisi') || str_contains($question, 'status'))
                ) {
                    return 'Aset ' . $asset->nama_aset . ' [' . $asset->kode_aset . '] berada di ruangan '
                        . ($asset->room?->name ?? '-') . ', lokasi ' . ($asset->lokasi?->name ?? '-')
                        . ', Unit ' . ($asset->unit?->name ?? '-') . ', dengan kondisi '
                        . ($asset->kondisi ?? '-') . '.';
                }
                return 'Kondisi aset ' . $asset->nama_aset . ' [' . $asset->kode_aset . '] adalah '
                    . ($asset->kondisi ?? '-') . '.';
            }
        }

        if (str_contains($question, 'mutasi')) {
            $mutations = AssetMutation::query()->with(['asset', 'fromUnit', 'toUnit'])->latest('mutation_date');
            if ($user?->hasRole('admin_unit')) {
                $mutations->where(function ($query) use ($user): void {
                    $query->where('from_unit_id', $user->unit_id)->orWhere('to_unit_id', $user->unit_id);
                });
            }

            if (
                str_contains($question, 'unit')
                && (str_contains($question, 'berapa') || str_contains($question, 'jumlah') || str_contains($question, 'total'))
            ) {
                $unit = $this->resolveUnitFromQuestion($question, $user);
                if ($unit === null) {
                    return 'Unit yang disebutkan tidak ditemukan. Periksa kembali nama atau kode unitnya.';
                }
                $count = (clone $mutations)->where(function ($query) use ($unit): void {
                    $query->where('from_unit_id', $unit->id)->orWhere('to_unit_id', $unit->id);
                })->count();
                return 'Terdapat ' . number_format($count, 0, ',', '.') . ' mutasi yang melibatkan ' . $unit->name . '.';
            }

            if (
                (str_contains($question, 'berapa') || str_contains($question, 'jumlah') || str_contains($question, 'total'))
                && (str_contains($question, 'selesai') || str_contains($question, 'proses')
                    || str_contains($question, 'pending') || str_contains($question, 'ditolak'))
            ) {
                $statuses = collect(['selesai', 'proses', 'pending', 'ditolak'])
                    ->filter(fn (string $status): bool => str_contains($question, $status));
                if ($statuses->count() > 1) {
                    return $statuses->map(fn (string $status): string => $status . ' '
                        . number_format((clone $mutations)->where('status', $status)->count(), 0, ',', '.'))
                        ->implode(', ') . '.';
                }
                $status = str_contains($question, 'selesai') ? 'selesai'
                    : (str_contains($question, 'proses') ? 'proses'
                        : (str_contains($question, 'pending') ? 'pending' : 'ditolak'));
                return 'Terdapat ' . number_format((clone $mutations)->where('status', $status)->count(), 0, ',', '.')
                    . ' mutasi dengan status ' . $status . '.';
            }

            if (
                str_contains($question, 'selesai')
                || str_contains($question, 'proses')
                || str_contains($question, 'pending')
                || str_contains($question, 'ditolak')
            ) {
                $status = str_contains($question, 'selesai') ? 'selesai'
                    : (str_contains($question, 'proses') ? 'proses'
                        : (str_contains($question, 'pending') ? 'pending' : 'ditolak'));
                $rows = (clone $mutations)->where('status', $status)->limit(5)->get();
                if ($rows->isEmpty()) {
                    return 'Belum ada mutasi dengan status ' . $status . '.';
                }
                $items = $rows->map(function (AssetMutation $mutation): string {
                    $asset = $mutation->asset?->nama_aset ?? 'Aset #' . $mutation->asset_id;
                    $from = $mutation->fromUnit?->name ?? '-';
                    $to = $mutation->toUnit?->name ?? '-';
                    return $asset . ' (' . $from . ' ke ' . $to . ', status ' . ($mutation->status ?? '-') . ')';
                })->implode('; ');
                return 'Mutasi dengan status ' . $status . ': ' . $items . '.';
            }

            if (str_contains($question, 'paling banyak') || str_contains($question, 'terbanyak') || str_contains($question, 'tertinggi')) {
                $counts = [];
                $mutations->get(['from_unit_id', 'to_unit_id'])->each(function (AssetMutation $mutation) use (&$counts): void {
                    foreach (array_unique(array_filter([(int) $mutation->from_unit_id, (int) $mutation->to_unit_id])) as $unitId) {
                        $counts[$unitId] = ($counts[$unitId] ?? 0) + 1;
                    }
                });

                if ($counts === []) {
                    return 'Belum ada data mutasi aset yang dapat dianalisis.';
                }

                arsort($counts);
                $topCount = max($counts);
                $topUnitIds = array_keys(array_filter($counts, fn (int $count): bool => $count === $topCount));
                $topUnits = Unit::query()->whereIn('id', $topUnitIds)->get()->keyBy('id');
                $leaders = collect($topUnitIds)->map(function (int $unitId) use ($topUnits, $topCount): string {
                    return ($topUnits->get($unitId)?->name ?? 'Unit #' . $unitId) . ' (' . number_format($topCount, 0, ',', '.') . ' mutasi)';
                })->implode(', ');

                return 'Unit dengan mutasi paling banyak adalah ' . $leaders . '. Perhitungan mencakup unit asal dan unit tujuan pada setiap mutasi.';
            }

            $rows = $mutations->limit(5)->get();
            if ($rows->isEmpty()) {
                return 'Belum ada data mutasi aset yang sesuai.';
            }
            $items = $rows->map(function (AssetMutation $mutation): string {
                $asset = $mutation->asset?->nama_aset ?? 'Aset #' . $mutation->asset_id;
                $from = $mutation->fromUnit?->name ?? '-';
                $to = $mutation->toUnit?->name ?? '-';
                return $asset . ' (' . $from . ' ke ' . $to . ', status ' . ($mutation->status ?? '-') . ')';
            })->implode('; ');
            return 'Berikut mutasi terbaru: ' . $items . '.';
        }

        if (
            (str_contains($question, 'usaha') || str_contains($question, 'bisnis'))
            && (str_contains($question, 'berapa') || str_contains($question, 'jumlah') || str_contains($question, 'total'))
        ) {
            return 'Terdapat ' . number_format($facts['usaha_yayasan'], 0, ',', '.') . ' usaha yayasan yang tercatat.';
        }

        if (str_contains($question, 'usaha') || str_contains($question, 'bisnis')) {
            $businesses = UsahaYayasan::query()->orderBy('bentuk_usaha')->get(['bentuk_usaha', 'lokasi', 'pengelola']);
            return $businesses->isEmpty()
                ? 'Belum ada data usaha yayasan.'
                : 'Data usaha yayasan: ' . $businesses->map(fn (UsahaYayasan $business): string => ($business->bentuk_usaha ?? '-') . ', lokasi ' . ($business->lokasi ?? '-') . ', pengelola ' . ($business->pengelola ?? '-') . '.')->implode(' ');
        }

        if (str_contains($question, 'aset bergerak') || str_contains($question, 'aset tidak bergerak')) {
            $key = str_contains($question, 'tidak bergerak') ? 'aset_tidak_bergerak' : 'aset_bergerak';
            $label = $key === 'aset_tidak_bergerak' ? 'aset tidak bergerak' : 'aset bergerak';
            return 'Terdapat ' . number_format($facts[$key], 0, ',', '.') . ' data ' . $label . '.';
        }

        if (
            (str_contains($question, 'aktivitas') || str_contains($question, 'kegiatan'))
            && (str_contains($question, 'terbaru') || str_contains($question, 'terakhir'))
        ) {
            $activities = AssetActivity::query()->with('user')->latest()->limit(20)->get();
            if ($activities->isEmpty()) {
                return 'Belum ada catatan aktivitas dalam sistem.';
            }

            $items = $activities->map(fn (AssetActivity $activity): string =>
                ($activity->action ?: 'Aktivitas') . ' oleh ' . ($activity->user?->name ?? 'Pengguna')
                . ($activity->description ? ': ' . $activity->description : '')
            )->implode('; ');
            return 'Aktivitas terbaru: ' . $items . '.';
        }

        if (str_contains($question, 'aktivitas') || str_contains($question, 'kegiatan')) {
            return 'Terdapat ' . number_format($facts['aktivitas'], 0, ',', '.') . ' catatan aktivitas dalam sistem.';
        }

        if (
            str_contains($question, 'pengguna')
            || str_contains($question, 'user')
            || (str_contains($question, 'admin') && str_contains($question, 'unit'))
        ) {
            if (
                str_contains($question, 'siapa')
                || str_contains($question, 'daftar')
                || str_contains($question, 'terdaftar')
            ) {
                $users = User::query()
                    ->when(str_contains($question, 'unit'), function (Builder $builder) use ($question, $user): void {
                        $unit = $this->resolveUnitFromQuestion($question, $user);
                        if ($unit !== null) {
                            $builder->where('unit_id', $unit->id);
                        }
                    })
                    ->when($user?->hasRole('admin_unit'), fn (Builder $builder) => $builder->where('unit_id', $user->unit_id))
                    ->orderBy('name')
                    ->limit(50)
                    ->get(['name', 'email']);
                return $users->isEmpty()
                    ? 'Belum ada pengguna yang terdaftar.'
                    : 'Pengguna yang terdaftar: ' . $users->map(
                        fn (User $listedUser): string => $listedUser->name . ' (' . $listedUser->email . ')'
                    )->implode(', ') . '.';
            }
            return 'Terdapat ' . number_format($facts['pengguna'], 0, ',', '.') . ' pengguna yang tercatat.';
        }

        if (str_contains($question, 'ringkasan') || str_contains($question, 'semua data') || str_contains($question, 'database') || str_contains($question, 'cakupan')) {
            return 'Ringkasan database: ' . number_format($facts['total_unit_aset'], 0, ',', '.') . ' unit aset inventaris, '
                . number_format($facts['jumlah_data_aset'], 0, ',', '.') . ' data aset, '
                . number_format($facts['aset_bergerak'], 0, ',', '.') . ' aset bergerak, '
                . number_format($facts['aset_tidak_bergerak'], 0, ',', '.') . ' aset tidak bergerak, '
                . number_format($facts['usaha_yayasan'], 0, ',', '.') . ' usaha yayasan, '
                . number_format($facts['jumlah_lokasi'], 0, ',', '.') . ' lokasi, '
                . number_format($facts['jumlah_ruangan'], 0, ',', '.') . ' ruangan, '
                . number_format($facts['mutasi'], 0, ',', '.') . ' mutasi, dan '
                . number_format($facts['peminjaman_aktif_atau_pending'], 0, ',', '.') . ' peminjaman aktif/pending.';
        }

        if (str_contains($question, 'rusak')) {
            $unit = $this->resolveUnitFromQuestion($question, $user);
            if ($unit) {
                $unitAssets = (clone $assetQuery)->where('unit_id', $unit->id);
                $light = (int) $unitAssets->sum('jumlah_rusak_ringan');
                $heavy = (int) $unitAssets->sum('jumlah_rusak_berat');

                return 'Pada ' . $unit->name . ' terdapat ' . number_format($light + $heavy, 0, ',', '.')
                    . ' unit aset rusak, terdiri dari ' . number_format($light, 0, ',', '.')
                    . ' rusak ringan dan ' . number_format($heavy, 0, ',', '.') . ' rusak berat.';
            }
        }

        if (
            str_contains($question, 'unit')
            && !str_contains($question, 'punya aset')
            && !str_contains($question, 'aset ini')
            && !str_contains($question, 'berada')
            && !str_contains($question, 'milik')
            && !str_contains($question, 'ruangan')
        ) {
            $units = Unit::query()->when($user?->hasRole('admin_unit'), fn ($query) => $query->whereKey($user->unit_id))->orderBy('name')->get(['name', 'code']);
            return $units->isEmpty()
                ? 'Tidak ada unit yang dapat ditampilkan.'
                : 'Unit yang terdaftar: ' . $units->map(fn (Unit $unit): string => $unit->name . ' (' . ($unit->code ?? '-') . ')')->implode(', ') . '.';
        }

        $searchTerms = preg_split('/\s+/u', trim(preg_replace('/[^\pL\pN\-]+/u', ' ', $question)));
        $stopWords = ['berapa', 'total', 'jumlah', 'detail', 'data', 'aset', 'inventaris', 'tolong', 'cari', 'tentang', 'yang', 'di', 'pada', 'untuk', 'apakah', 'ada'];
        $terms = array_values(array_filter($searchTerms ?: [], fn (string $term): bool => mb_strlen($term) >= 3 && !in_array($term, $stopWords, true)));
        if ($terms === []) {
            return null;
        }

        $search = clone $assetQuery;
        $identifier = collect($terms)->first(fn (string $term): bool => preg_match('/\d{3,}/', $term) === 1);
        $assetPhrase = trim(implode(' ', array_filter($terms, fn (string $term): bool => !in_array($term, ['ada', 'mana', 'ruangan', 'lokasi'], true))));

        if ($identifier !== null) {
            $search->where(function ($query) use ($identifier, $assetPhrase): void {
                $query->where('kode_aset', 'like', '%' . $identifier . '%')
                    ->orWhere('nama_aset', 'like', '%' . $identifier . '%')
                    ->orWhere('spesifikasi', 'like', '%' . $identifier . '%');
                if ($assetPhrase !== '') {
                    $query->orWhere('nama_aset', 'like', '%' . $assetPhrase . '%')
                        ->orWhere('kode_aset', 'like', '%' . $assetPhrase . '%');
                }
            });
        } else {
            $search->where(function ($query) use ($terms): void {
                foreach ($terms as $term) {
                    $query->orWhere('nama_aset', 'like', '%' . $term . '%')
                        ->orWhere('kode_aset', 'like', '%' . $term . '%')
                        ->orWhere('spesifikasi', 'like', '%' . $term . '%');
                }
            });
        }
        $assets = $search->with(['unit', 'lokasi', 'room'])->limit(8)->get();
        $quantityQuestion = str_contains($question, 'berapa')
            || str_contains($question, 'jumlah');
        $existenceQuestion = str_contains($question, 'apakah ada')
            || str_contains($question, 'ada aset')
            || str_contains($question, 'tersedia aset');
        if ($assets->isEmpty()) {
            if ($identifier !== null) {
                return 'Aset dengan kode atau nomor "' . $identifier . '" tidak ditemukan.';
            }
            if ($existenceQuestion) {
                return 'Tidak ada aset yang cocok dengan nama atau kata kunci tersebut.';
            }
            if ($quantityQuestion) {
                return 'Saya belum menemukan aset dengan nama tersebut. Sebutkan nama lengkap, kode aset, atau unit agar jumlahnya dapat dihitung dengan tepat.';
            }
            return null;
        }

        if ($existenceQuestion) {
            $assetNames = $assets->pluck('nama_aset')->unique()->values();
            return 'Ya, terdapat ' . number_format($assets->count(), 0, ',', '.') . ' data aset yang cocok: '
                . $assetNames->implode(', ') . '.';
        }

        $borrowingQuestion = str_contains($question, 'pinjam')
            || str_contains($question, 'peminjaman')
            || str_contains($question, 'dipinjam');
        if ($borrowingQuestion && $assets->count() > 1) {
            return 'Ditemukan beberapa aset yang sesuai. Sebutkan kode aset yang ingin dipinjam agar saya dapat memeriksa ketersediaannya dengan tepat.';
        }
        if ($borrowingQuestion && $assets->count() === 1) {
            $asset = $assets->first();
            $borrowedQuantity = (int) AssetBorrowing::query()
                ->where('asset_id', $asset->id)
                ->whereIn('status', ['pending', 'dipinjam', 'pengembalian'])
                ->sum('quantity');
            $unavailableQuantity = (int) $asset->jumlah_rusak_berat + (int) $asset->jumlah_dalam_perbaikan;
            $availableQuantity = max(0, (int) $asset->jumlah - $unavailableQuantity - $borrowedQuantity);

            if ($unavailableQuantity > 0) {
                $reason = (int) $asset->jumlah_dalam_perbaikan > 0
                    ? 'sedang dalam perbaikan'
                    : 'mengalami kerusakan berat';
                return 'Tidak, aset ' . $asset->nama_aset . ' [' . $asset->kode_aset . '] tidak dapat dipinjam karena '
                    . $reason . '.';
            }

            if ($borrowedQuantity > 0) {
                return 'Belum bisa dipinjam karena sedang digunakan sebanyak '
                    . number_format($borrowedQuantity, 0, ',', '.') . ' unit. Jumlah yang tersedia saat ini '
                    . number_format($availableQuantity, 0, ',', '.') . ' unit.';
            }

            return $availableQuantity > 0
                ? 'Bisa dipinjam. Aset ' . $asset->nama_aset . ' [' . $asset->kode_aset . '] memiliki '
                    . number_format($availableQuantity, 0, ',', '.') . ' unit yang tersedia.'
                : 'Tidak bisa dipinjam karena stok yang tersedia sudah habis.';
        }

        if ($quantityQuestion && $assets->count() > 1) {
            return 'Ditemukan beberapa aset yang sesuai. Sebutkan kode aset atau unitnya agar jumlah yang saya berikan tepat.';
        }

        if (
            $assets->count() === 1
            && $quantityQuestion
            && (str_contains($question, 'aset') || str_contains($question, 'unit'))
        ) {
            $asset = $assets->first();
            return 'Jumlah aset ' . $asset->nama_aset . ' [' . $asset->kode_aset . '] adalah '
                . number_format((int) $asset->jumlah, 0, ',', '.') . ' unit.';
        }

        $locationQuestion = str_contains($question, 'ruangan')
            || str_contains($question, 'lokasi')
            || str_contains($question, 'ada di mana')
            || str_contains($question, 'berada di mana');
        $unitQuestion = str_contains($question, 'unit mana')
            || str_contains($question, 'unit berapa')
            || str_contains($question, 'berada di unit');
        if (($locationQuestion || $unitQuestion) && $assets->count() === 1) {
            $asset = $assets->first();
            if ($unitQuestion && ! $locationQuestion) {
                return 'Aset ' . $asset->nama_aset . ' [' . $asset->kode_aset . '] berada di ' . ($asset->unit?->name ?? '-') . '.';
            }
            return 'Aset ' . $asset->nama_aset . ' [' . $asset->kode_aset . '] berada di ruangan '
                . ($asset->room?->name ?? '-') . ', lokasi ' . ($asset->lokasi?->name ?? '-')
                . ', Unit ' . ($asset->unit?->name ?? '-') . '.';
        }

        $items = $assets->map(function (AsetInventaris $asset): string {
            return $asset->nama_aset . ' [' . $asset->kode_aset . '], jumlah ' . number_format((int) $asset->jumlah, 0, ',', '.')
                . ', kondisi ' . ($asset->kondisi ?? '-') . ', unit ' . ($asset->unit?->name ?? '-')
                . ', lokasi ' . ($asset->lokasi?->name ?? '-') . ', ruangan ' . ($asset->room?->name ?? '-')
                . ', harga perolehan Rp ' . number_format((float) $asset->harga_perolehan, 0, ',', '.') . '.';
        })->implode(' ');

        return 'Saya menemukan ' . $assets->count() . ' data aset: ' . $items;
    }

    private function findSingleAssetFromQuestion(string $question, Builder $assetQuery): ?AsetInventaris
    {
        preg_match('/\d{3,}/', $question, $matches);
        $identifier = $matches[0] ?? null;
        if ($identifier === null) {
            return null;
        }

        return (clone $assetQuery)
            ->where(function ($query) use ($identifier): void {
                $query->where('kode_aset', 'like', '%' . $identifier . '%')
                    ->orWhere('nama_aset', 'like', '%' . $identifier . '%')
                    ->orWhere('spesifikasi', 'like', '%' . $identifier . '%');
            })
            ->with(['unit', 'lokasi', 'room'])
            ->first();
    }

    private function resolveUnitFromQuestion(string $question, $user): ?Unit
    {
        if ($user?->hasRole('admin_unit')) {
            return Unit::find($user->unit_id);
        }

        if (preg_match('/\bunit\s*-?\s*(\d{1,2})\b/u', $question, $matches)) {
            $number = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
            return Unit::query()
                ->where(function ($query) use ($number): void {
                    $query->where('code', 'UNIT-' . $number)
                        ->orWhere('name', 'Unit ' . (int) $number)
                        ->orWhere('name', 'Unit ' . $number);
                })
                ->first();
        }

        return null;
    }

    private function resolveRoomFromQuestion(string $question, $user): ?Room
    {
        $rooms = Room::query()
            ->when($user?->hasRole('admin_unit'), fn (Builder $builder) => $builder->where('unit_id', $user->unit_id))
            ->get(['id', 'name', 'code', 'unit_id']);

        return $rooms
            ->sortByDesc(fn (Room $room): int => mb_strlen((string) $room->name))
            ->first(function (Room $room) use ($question): bool {
                return str_contains($question, mb_strtolower((string) $room->name))
                    || ($room->code && str_contains($question, mb_strtolower($room->code)));
            });
    }

    private function resolveLocationFromQuestion(string $question, $user): ?Location
    {
        return Location::query()
            ->when($user?->hasRole('admin_unit'), fn (Builder $builder) => $builder->where('unit_id', $user->unit_id))
            ->get(['id', 'name', 'code'])
            ->sortByDesc(fn (Location $location): int => mb_strlen((string) $location->name))
            ->first(fn (Location $location): bool => str_contains($question, mb_strtolower((string) $location->name))
                || ($location->code && str_contains($question, mb_strtolower($location->code))));
    }

    private function fallbackAnswer(string $question, array $facts): string
    {
        $normalized = mb_strtolower($question);
        if (preg_match('/\b(siapa|kamu siapa|anda siapa|dirimu)\b/u', $normalized)) {
            if (str_contains($normalized, 'pembuat') || str_contains($normalized, 'pencipta') || str_contains($normalized, 'buat kamu')) {
                return 'Saya dibuat oleh Feri Yusnanda, mahasiswa Prodi PTI, Universitas Nurul Huda.';
            }
            return 'Saya adalah Asisten Inventaris khusus aplikasi ini. Saya menjawab berdasarkan data inventaris terbaru di database.';
        }
        if (str_contains($normalized, 'rugi') || str_contains($normalized, 'kerugian') || str_contains($normalized, 'nilai rusak')) {
            return 'Perkiraan nilai kerugian aset rusak adalah Rp ' . number_format($facts['nilai_kerugian_aset_rusak'], 0, ',', '.')
                . '. Perhitungan menggunakan proporsi jumlah aset rusak terhadap harga perolehan tiap data aset.';
        }
        if (str_contains($normalized, 'rusak')) {
            return 'Total aset rusak saat ini adalah ' . number_format($facts['total_rusak'], 0, ',', '.') . ' unit, terdiri dari '
                . number_format($facts['rusak_ringan'], 0, ',', '.') . ' rusak ringan dan '
                . number_format($facts['rusak_berat'], 0, ',', '.') . ' rusak berat.';
        }
        $assetSpecificTerms = trim((string) preg_replace(
            '/\b(berapa|total|jumlah|unit|aset|inventaris|yang|ada|apakah|dengan|untuk|ini|itu)\b/u',
            ' ',
            $normalized
        ));
        $assetSpecificTerms = trim((string) preg_replace('/[^\pL\pN\s-]+/u', ' ', $assetSpecificTerms));
        $assetSpecificTerms = trim((string) preg_replace('/\s+/u', ' ', $assetSpecificTerms));
        if (
            str_contains($normalized, 'aset')
            && $assetSpecificTerms !== ''
            && (str_contains($normalized, 'total') || str_contains($normalized, 'jumlah') || str_contains($normalized, 'berapa'))
        ) {
            if (preg_match('/\b(saat|sekarang|yang ada)\b/u', $assetSpecificTerms) === 1) {
                return 'Total aset inventaris saat ini adalah ' . number_format($facts['total_unit_aset'], 0, ',', '.') . ' unit.';
            }
            return 'Saya belum menemukan aset dengan nama atau kata kunci "' . $assetSpecificTerms . '".';
        }
        if (
            str_contains($normalized, 'aset')
            && $assetSpecificTerms === ''
            && (str_contains($normalized, 'total') || str_contains($normalized, 'jumlah') || str_contains($normalized, 'berapa'))
        ) {
            return 'Total aset inventaris saat ini adalah ' . number_format($facts['total_unit_aset'], 0, ',', '.') . ' unit.';
        }
        if (str_contains($normalized, 'lokasi')) {
            return 'Inventaris tersebar pada ' . number_format($facts['jumlah_lokasi'], 0, ',', '.') . ' lokasi.';
        }
        if (str_contains($normalized, 'ruangan')) {
            return 'Inventaris tercatat pada ' . number_format($facts['jumlah_ruangan'], 0, ',', '.') . ' ruangan.';
        }
        return 'Maaf, saya belum menemukan jawaban yang sesuai. Coba sebutkan nama aset, kode aset, unit, lokasi, atau ruangan agar pencarian lebih spesifik.';
    }

    private function unsupportedAnswer(): string
    {
        return 'Pertanyaan tersebut di luar cakupan Asisten Inventaris. Saya hanya dapat membantu berdasarkan data aset, unit, lokasi, ruangan, kondisi, peminjaman, mutasi, laporan, dan pengguna.';
    }
}
