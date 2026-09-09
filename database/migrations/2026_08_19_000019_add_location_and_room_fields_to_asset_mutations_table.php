<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_mutations', function (Blueprint $table) {
            if (!Schema::hasColumn('asset_mutations', 'from_location_id')) {
                $table->foreignId('from_location_id')->nullable()->after('from_unit_id')->constrained('locations')->nullOnDelete();
            }

            if (!Schema::hasColumn('asset_mutations', 'to_location_id')) {
                $table->foreignId('to_location_id')->nullable()->after('to_unit_id')->constrained('locations')->nullOnDelete();
            }

            if (!Schema::hasColumn('asset_mutations', 'from_room_id')) {
                $table->foreignId('from_room_id')->nullable()->after('from_location_id')->constrained('rooms')->nullOnDelete();
            }

            if (!Schema::hasColumn('asset_mutations', 'to_room_id')) {
                $table->foreignId('to_room_id')->nullable()->after('to_location_id')->constrained('rooms')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('asset_mutations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('from_location_id');
            $table->dropConstrainedForeignId('to_location_id');
            $table->dropConstrainedForeignId('from_room_id');
            $table->dropConstrainedForeignId('to_room_id');
        });
    }
};
