<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Create the requested initial asset and foundation-business records.
     */
    public function up(): void
    {
        DB::transaction(function (): void {
            $now = now();

            for ($number = 1; $number <= 50; $number++) {
                $suffix = str_pad((string) $number, 2, '0', STR_PAD_LEFT);
                $unitNumber = (($number - 1) % 10) + 1;
                $unitName = 'Unit ' . str_pad((string) $unitNumber, 2, '0', STR_PAD_LEFT);
                $year = 2019 + (($number - 1) % 7);

                DB::table('aset_bergerak')->insert([
                    'bentuk_aset' => "Kendaraan Operasional {$suffix}",
                    'dasar_hak' => 'Milik yayasan',
                    'atas_nama' => 'Yayasan',
                    'tahun_perolehan' => $year,
                    'nomor_registrasi' => "AB-{$suffix}/YYS",
                    'keterangan' => "Data awal | {$unitName} | Aset bergerak {$suffix}",
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                DB::table('aset_tidak_bergerak')->insert([
                    'bentuk_aset' => "Bangunan dan Fasilitas {$suffix}",
                    'dasar_hak' => 'Milik yayasan',
                    'atas_nama' => 'Yayasan',
                    'tahun_perolehan' => $year,
                    'jangka_waktu' => 'Tidak terbatas',
                    'keterangan' => "Data awal | {$unitName} | Aset tidak bergerak {$suffix}",
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                DB::table('usaha_yayasan')->insert([
                    'bentuk_usaha' => "Usaha Yayasan {$suffix}",
                    'lokasi' => $unitName,
                    'pengelola' => "Pengelola {$suffix}",
                    'mulai_operasional' => sprintf('%d-%02d-01', $year, (($number - 1) % 12) + 1),
                    'dasar_perjanjian' => 'Surat keputusan yayasan',
                    'keterangan' => "Data awal | {$unitName} | Usaha yayasan {$suffix}",
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        });
    }

    public function down(): void
    {
        DB::table('aset_bergerak')
            ->where('keterangan', 'like', 'Data awal | Unit % | Aset bergerak %')
            ->delete();

        DB::table('aset_tidak_bergerak')
            ->where('keterangan', 'like', 'Data awal | Unit % | Aset tidak bergerak %')
            ->delete();

        DB::table('usaha_yayasan')
            ->where('keterangan', 'like', 'Data awal | Unit % | Usaha yayasan %')
            ->delete();
    }
};
