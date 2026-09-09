<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Ensure every generated room has at least one linked inventory asset.
     */
    public function up(): void
    {
        DB::transaction(function (): void {
            $now = now();
            $occupiedRoomIds = DB::table('aset_inventaris')
                ->whereNotNull('room_id')
                ->pluck('room_id');

            $rooms = DB::table('rooms')
                ->join('locations', 'rooms.location_id', '=', 'locations.id')
                ->where('rooms.code', 'like', 'ROOM-%')
                ->whereNotIn('rooms.id', $occupiedRoomIds)
                ->orderBy('rooms.id')
                ->get([
                    'rooms.id as room_id',
                    'rooms.location_id',
                    'locations.unit_id',
                    'locations.code as location_code',
                ]);

            $assets = [];
            foreach ($rooms as $index => $room) {
                $assetNumber = $index + 1;
                $suffix = str_pad((string) $assetNumber, 5, '0', STR_PAD_LEFT);
                $year = random_int(2018, 2025);
                $month = random_int(1, 12);
                $day = random_int(1, 28);
                $condition = ['Baik', 'Rusak Ringan', 'Rusak Berat', 'Dalam Perbaikan'][$assetNumber % 4];

                $assets[] = [
                    'kode_aset' => "{$room->location_code}-AST-{$suffix}",
                    'tanggal_pembukuan' => sprintf('%d-%02d-%02d', $year, $month, $day),
                    'nama_aset' => "Inventaris {$room->location_code} {$suffix}",
                    'spesifikasi' => "Spesifikasi lengkap inventaris ruangan {$room->room_id}",
                    'jumlah' => 400,
                    'jumlah_baik' => 100,
                    'jumlah_rusak_ringan' => 100,
                    'jumlah_rusak_berat' => 100,
                    'jumlah_dalam_perbaikan' => 100,
                    'satuan' => 'unit',
                    'asal_barang' => ['Pengadaan yayasan', 'Hibah', 'Bantuan operasional', 'Pengadaan unit'][$assetNumber % 4],
                    'tahun_pengadaan' => $year,
                    'harga_perolehan' => random_int(750, 9500) * 1000,
                    'kondisi' => $condition,
                    'lokasi_id' => $room->location_id,
                    'unit_id' => $room->unit_id,
                    'room_id' => $room->room_id,
                    'deskripsi' => "Aset inventaris terhubung ke unit, lokasi, dan ruangan {$room->room_id}. Foto dan dokumen belum diunggah.",
                    'gambar' => null,
                    'dokumen' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if (count($assets) >= 500) {
                    DB::table('aset_inventaris')->insert($assets);
                    $assets = [];
                }
            }

            if ($assets !== []) {
                DB::table('aset_inventaris')->insert($assets);
            }
        });
    }

    public function down(): void
    {
        DB::table('aset_inventaris')
            ->where('kode_aset', 'like', 'UNIT-%-LOC-%-AST-%')
            ->delete();
    }
};
