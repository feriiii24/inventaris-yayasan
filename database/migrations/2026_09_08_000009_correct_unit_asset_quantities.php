<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Correct the dataset to 100 asset records per unit with 100 items per condition.
     */
    public function up(): void
    {
        DB::transaction(function (): void {
            $now = now();
            $units = DB::table('units')->orderBy('id')->get(['id', 'code']);

            DB::table('aset_inventaris')
                ->where('kode_aset', 'like', 'UNIT-%-AST-%')
                ->delete();

            foreach ($units as $unit) {
                $rooms = DB::table('rooms')
                    ->join('locations', 'rooms.location_id', '=', 'locations.id')
                    ->where('locations.unit_id', $unit->id)
                    ->where('locations.code', 'like', 'UNIT-%-LOC-%')
                    ->orderBy('rooms.id')
                    ->get(['rooms.id as room_id', 'rooms.location_id'])
                    ->values();

                $assets = [];

                for ($assetNumber = 1; $assetNumber <= 100; $assetNumber++) {
                    $room = $rooms->get(($assetNumber - 1) % max($rooms->count(), 1));
                    $suffix = str_pad((string) $assetNumber, 3, '0', STR_PAD_LEFT);
                    $year = 2020 + (($assetNumber - 1) % 5);

                    $assets[] = [
                        'kode_aset' => "{$unit->code}-AST-{$suffix}",
                        'tanggal_pembukuan' => sprintf('%d-%02d-%02d', $year, (($assetNumber - 1) % 12) + 1, (($assetNumber - 1) % 28) + 1),
                        'nama_aset' => "Inventaris {$unit->code} {$suffix}",
                        'spesifikasi' => "Spesifikasi lengkap inventaris {$unit->code} {$suffix}",
                        'jumlah' => 400,
                        'jumlah_baik' => 100,
                        'jumlah_rusak_ringan' => 100,
                        'jumlah_rusak_berat' => 100,
                        'jumlah_dalam_perbaikan' => 100,
                        'satuan' => 'unit',
                        'asal_barang' => 'Pengadaan yayasan',
                        'tahun_pengadaan' => $year,
                        'harga_perolehan' => 1000000 + ($assetNumber * 25000),
                        'kondisi' => 'Baik',
                        'lokasi_id' => $room?->location_id,
                        'unit_id' => $unit->id,
                        'room_id' => $room?->room_id,
                        'deskripsi' => "Data inventaris {$unit->code} {$suffix}; masing-masing kondisi berjumlah 100 unit. Foto dan dokumen belum diunggah.",
                        'gambar' => null,
                        'dokumen' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                DB::table('aset_inventaris')->insert($assets);
            }
        });
    }

    public function down(): void
    {
        DB::table('aset_inventaris')
            ->where('kode_aset', 'like', 'UNIT-%-AST-%')
            ->delete();
    }
};
