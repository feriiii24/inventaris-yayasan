<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Keep exactly 20 connected rooms for every generated location.
     */
    public function up(): void
    {
        DB::transaction(function (): void {
            $locations = DB::table('locations')
                ->where('code', 'like', 'UNIT-%-LOC-%')
                ->orderBy('id')
                ->get(['id']);

            foreach ($locations as $location) {
                $roomIds = DB::table('rooms')
                    ->where('location_id', $location->id)
                    ->orderBy('id')
                    ->pluck('id');

                if ($roomIds->count() <= 20) {
                    continue;
                }

                $keeperId = $roomIds->first();
                $excessIds = $roomIds->slice(20)->values();

                DB::table('aset_inventaris')
                    ->whereIn('room_id', $excessIds)
                    ->update(['room_id' => $keeperId]);

                DB::table('asset_mutations')
                    ->whereIn('from_room_id', $excessIds)
                    ->update(['from_room_id' => $keeperId]);

                DB::table('asset_mutations')
                    ->whereIn('to_room_id', $excessIds)
                    ->update(['to_room_id' => $keeperId]);

                DB::table('rooms')->whereIn('id', $excessIds)->delete();
            }
        });
    }

    public function down(): void
    {
        // The removed room records contained generated setup data and are not restored.
    }
};
