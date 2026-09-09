<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Randomize asset placement and valuation while preserving unit ownership.
     */
    public function up(): void
    {
        DB::transaction(function (): void {
            $now = now();
            $assets = DB::table('aset_inventaris')
                ->where('kode_aset', 'like', 'UNIT-%-AST-%')
                ->orderBy('id')
                ->get(['id', 'unit_id']);

            $roomsByUnit = DB::table('rooms')
                ->join('locations', 'rooms.location_id', '=', 'locations.id')
                ->where('locations.code', 'like', 'UNIT-%-LOC-%')
                ->get([
                    'rooms.id as room_id',
                    'rooms.location_id',
                    'locations.unit_id',
                ])
                ->groupBy('unit_id')
                ->map(fn ($rooms) => $rooms->values());

            $origins = ['Pengadaan yayasan', 'Hibah', 'Bantuan operasional', 'Pengadaan unit'];

            foreach ($assets as $asset) {
                $unitRooms = $roomsByUnit->get($asset->unit_id, collect());

                if ($unitRooms->isEmpty()) {
                    throw new RuntimeException("Unit {$asset->unit_id} tidak memiliki ruangan.");
                }

                $room = $unitRooms->random();
                $year = random_int(2018, 2025);
                $month = random_int(1, 12);
                $day = random_int(1, 28);

                DB::table('aset_inventaris')
                    ->where('id', $asset->id)
                    ->update([
                        'tanggal_pembukuan' => sprintf('%d-%02d-%02d', $year, $month, $day),
                        'tahun_pengadaan' => $year,
                        'harga_perolehan' => random_int(750, 9500) * 1000,
                        'asal_barang' => $origins[array_rand($origins)],
                        'lokasi_id' => $room->location_id,
                        'room_id' => $room->room_id,
                        'updated_at' => $now,
                    ]);
            }
        });
    }

    public function down(): void
    {
        // Randomized values are intentionally not restored.
    }
};
