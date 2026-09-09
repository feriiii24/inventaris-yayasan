<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Complete every unit profile and connect it to a dedicated location.
     */
    public function up(): void
    {
        DB::transaction(function (): void {
            $now = now();

            for ($number = 1; $number <= 10; $number++) {
                $suffix = str_pad((string) $number, 2, '0', STR_PAD_LEFT);
                $unitCode = "UNIT-{$suffix}";
                $locationCode = "LOC-{$suffix}";
                $unitId = DB::table('units')->where('code', $unitCode)->value('id');

                if ($unitId === null) {
                    continue;
                }

                DB::table('locations')->updateOrInsert(
                    ['code' => $locationCode],
                    [
                        'name' => "Lokasi Unit {$suffix}",
                        'description' => "Lokasi operasional Unit {$suffix}",
                        'unit_id' => $unitId,
                        'status' => 'aktif',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ],
                );

                $locationId = DB::table('locations')->where('code', $locationCode)->value('id');

                DB::table('units')
                    ->where('id', $unitId)
                    ->update([
                        'leader_name' => "Kepala Unit {$suffix}",
                        'type' => 'Unit Operasional',
                        'location_id' => $locationId,
                        'address' => "Jl. Yayasan Utama No. {$number}, Wilayah {$suffix}",
                        'status' => 'aktif',
                        'updated_at' => $now,
                    ]);
            }
        });
    }

    public function down(): void
    {
        DB::transaction(function (): void {
            $locationIds = DB::table('locations')
                ->whereIn('code', array_map(
                    fn (int $number): string => 'LOC-' . str_pad((string) $number, 2, '0', STR_PAD_LEFT),
                    range(1, 10),
                ))
                ->pluck('id');

            DB::table('units')->whereIn('location_id', $locationIds)->update([
                'leader_name' => null,
                'type' => null,
                'location_id' => null,
                'address' => null,
            ]);

            DB::table('locations')->whereIn('id', $locationIds)->delete();
        });
    }
};
