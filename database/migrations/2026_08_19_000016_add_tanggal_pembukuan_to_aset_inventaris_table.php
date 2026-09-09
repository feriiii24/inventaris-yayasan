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
            if (!Schema::hasColumn('aset_inventaris', 'tanggal_pembukuan')) {
                $table->date('tanggal_pembukuan')->nullable()->after('kode_aset');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('aset_inventaris', function (Blueprint $table) {
            if (Schema::hasColumn('aset_inventaris', 'tanggal_pembukuan')) {
                $table->dropColumn('tanggal_pembukuan');
            }
        });
    }
};
