<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('aset_inventaris', function (Blueprint $table) {
            if (!Schema::hasColumn('aset_inventaris', 'room_id')) {
                $table->unsignedBigInteger('room_id')->nullable()->after('unit_id');
            }
        });

        Schema::table('aset_inventaris', function (Blueprint $table) {
            if (Schema::hasColumn('aset_inventaris', 'room_id')) {
                $table->foreign('room_id')->references('id')->on('rooms')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('aset_inventaris', function (Blueprint $table) {
            if (Schema::hasColumn('aset_inventaris', 'room_id')) {
                $table->dropForeign(['room_id']);
                $table->dropColumn('room_id');
            }
        });
    }
};
