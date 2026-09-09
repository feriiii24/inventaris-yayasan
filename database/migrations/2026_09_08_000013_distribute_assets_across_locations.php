<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Place every generated asset in a valid room, spread across each unit's locations.
     */
    public function up(): void
    {
        DB::transaction(function (): void {
            $assetsByUnit = DB::table('aset_inventaris')
                ->where('kode_aset', 'like', 'UNIT-%-AST-%')
                ->orderBy('unit_id')
                ->orderBy('id')
                ->get(['id', 'unit_id'])
                ->groupBy('unit_id');

            foreach ($assetsByUnit as $unitId => $assets) {
                $rooms = DB::table('rooms')
                    ->join('locations', 'rooms.location_id', '=', 'locations.id')
                    ->where('locations.unit_id', $unitId)
                    ->where('locations.code', 'like', 'UNIT-%-LOC-%')
                    ->orderBy('locations.id')
                    ->orderBy('rooms.id')
                    ->get(['rooms.id as room_id', 'rooms.location_id'])
                    ->groupBy('location_id')
                    ->map(fn ($locationRooms) => $locationRooms->first())
                    ->values();

                if ($rooms->isEmpty()) {
                    throw new RuntimeException("Unit {$unitId} tidak memiliki ruangan.");
                }

                foreach ($assets->values() as $index => $asset) {
                    $room = $rooms->get($index % $rooms->count());

                    DB::table('aset_inventaris')
                        ->where('id', $asset->id)
                        ->update([
                            'lokasi_id' => $room->location_id,
                            'room_id' => $room->room_id,
                            'updated_at' => now(),
                        ]);
                }
            }
        });
    }

    public function down(): void
    {
        // The generated asset placement is intentionally not reverted.
    }
};
