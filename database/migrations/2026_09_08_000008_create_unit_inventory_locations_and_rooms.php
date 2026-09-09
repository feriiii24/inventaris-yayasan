<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Create the complete unit inventory hierarchy requested by the user.
     */
    public function up(): void
    {
        DB::transaction(function (): void {
            $now = now();
            $units = DB::table('units')->orderBy('id')->get(['id', 'code']);

            foreach ($units as $unit) {
                for ($locationNumber = 1; $locationNumber <= 100; $locationNumber++) {
                    $suffix = str_pad((string) $locationNumber, 3, '0', STR_PAD_LEFT);
                    $locationCode = "{$unit->code}-LOC-{$suffix}";
                    $legacyLocationCode = 'LOC-' . str_pad((string) ($unit->id), 2, '0', STR_PAD_LEFT);
                    $locationValues = [
                        'name' => "Lokasi {$unit->code} " . str_pad((string) $locationNumber, 3, '0', STR_PAD_LEFT),
                        'code' => $locationCode,
                        'description' => "Lokasi inventaris {$unit->code}, area {$locationNumber}",
                        'unit_id' => $unit->id,
                        'status' => 'aktif',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];

                    if ($locationNumber === 1) {
                        DB::table('locations')
                            ->where('code', $legacyLocationCode)
                            ->update($locationValues);
                    } else {
                        DB::table('locations')->updateOrInsert(
                            ['code' => $locationCode],
                            $locationValues,
                        );
                    }
                }
            }

            $locations = DB::table('locations')
                ->where('code', 'like', 'UNIT-%-LOC-%')
                ->whereIn('unit_id', $units->pluck('id'))
                ->orderBy('unit_id')
                ->orderBy('id')
                ->get(['id', 'unit_id']);

            $rooms = [];
            foreach ($locations as $location) {
                for ($roomNumber = 1; $roomNumber <= 100; $roomNumber++) {
                    $rooms[] = [
                        'location_id' => $location->id,
                        'name' => 'Ruangan ' . str_pad((string) $roomNumber, 3, '0', STR_PAD_LEFT),
                        'code' => "ROOM-{$location->id}-" . str_pad((string) $roomNumber, 3, '0', STR_PAD_LEFT),
                        'floor' => 'Lantai ' . (((($roomNumber - 1) % 5) + 1)),
                        'description' => "Ruangan inventaris lokasi {$location->id}, nomor {$roomNumber}",
                        'status' => 'aktif',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            foreach (array_chunk($rooms, 1000) as $chunk) {
                DB::table('rooms')->insert($chunk);
            }

            $roomsByUnit = DB::table('rooms')
                ->join('locations', 'rooms.location_id', '=', 'locations.id')
                ->whereIn('locations.unit_id', $units->pluck('id'))
                ->orderBy('locations.unit_id')
                ->orderBy('rooms.id')
                ->get(['rooms.id', 'locations.unit_id']);
            $roomIdsByUnit = $roomsByUnit->groupBy('unit_id');

            $conditions = [
                'Baik' => 'BAIK',
                'Rusak Ringan' => 'RR',
                'Rusak Berat' => 'RB',
                'Dalam Perbaikan' => 'DP',
            ];
            $assets = [];
            $assetNumber = 1;

            foreach ($units as $unit) {
                $unitRooms = $roomIdsByUnit->get($unit->id, collect())->values();
                $roomIndex = 0;

                foreach ($conditions as $condition => $conditionCode) {
                    for ($conditionNumber = 1; $conditionNumber <= 100; $conditionNumber++) {
                        $room = $unitRooms->get($roomIndex % max($unitRooms->count(), 1));
                        $roomId = $room?->id;
                        $locationId = $room
                            ? DB::table('rooms')->where('id', $roomId)->value('location_id')
                            : null;
                        $suffix = str_pad((string) $conditionNumber, 3, '0', STR_PAD_LEFT);

                        $assets[] = [
                            'kode_aset' => "{$unit->code}-AST-{$conditionCode}-{$suffix}",
                            'tanggal_pembukuan' => sprintf('%d-%02d-%02d', 2020 + ($conditionNumber % 5), (($conditionNumber - 1) % 12) + 1, (($conditionNumber - 1) % 28) + 1),
                            'nama_aset' => "Inventaris {$unit->code} {$conditionCode} {$suffix}",
                            'spesifikasi' => "Spesifikasi standar aset {$conditionCode} untuk {$unit->code}",
                            'jumlah' => 1,
                            'jumlah_baik' => $condition === 'Baik' ? 1 : 0,
                            'jumlah_rusak_ringan' => $condition === 'Rusak Ringan' ? 1 : 0,
                            'jumlah_rusak_berat' => $condition === 'Rusak Berat' ? 1 : 0,
                            'jumlah_dalam_perbaikan' => $condition === 'Dalam Perbaikan' ? 1 : 0,
                            'satuan' => 'unit',
                            'asal_barang' => 'Pengadaan yayasan',
                            'tahun_pengadaan' => 2020 + ($conditionNumber % 5),
                            'harga_perolehan' => 1000000 + ($assetNumber * 25000),
                            'kondisi' => $condition,
                            'lokasi_id' => $locationId,
                            'unit_id' => $unit->id,
                            'room_id' => $roomId,
                            'deskripsi' => "Data inventaris lengkap {$unit->code}; kondisi {$condition}; foto dan dokumen belum diunggah.",
                            'gambar' => null,
                            'dokumen' => null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];

                        $roomIndex++;
                        $assetNumber++;

                        if (count($assets) >= 500) {
                            DB::table('aset_inventaris')->insert($assets);
                            $assets = [];
                        }
                    }
                }
            }

            if ($assets !== []) {
                DB::table('aset_inventaris')->insert($assets);
            }
        });
    }

    public function down(): void
    {
        DB::transaction(function (): void {
            DB::table('aset_inventaris')->where('kode_aset', 'like', 'UNIT-%-AST-%')->delete();

            $locationIds = DB::table('locations')
                ->where('code', 'like', 'UNIT-%-LOC-%')
                ->pluck('id');

            DB::table('rooms')->whereIn('location_id', $locationIds)->delete();
            DB::table('locations')->whereIn('id', $locationIds)->delete();
        });
    }
};
