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
            if (!Schema::hasColumn('aset_inventaris', 'jumlah_baik')) {
                $table->integer('jumlah_baik')->default(0)->after('jumlah');
            }
            if (!Schema::hasColumn('aset_inventaris', 'jumlah_rusak_ringan')) {
                $table->integer('jumlah_rusak_ringan')->default(0)->after('jumlah_baik');
            }
            if (!Schema::hasColumn('aset_inventaris', 'jumlah_rusak_berat')) {
                $table->integer('jumlah_rusak_berat')->default(0)->after('jumlah_rusak_ringan');
            }
            if (!Schema::hasColumn('aset_inventaris', 'jumlah_dalam_perbaikan')) {
                $table->integer('jumlah_dalam_perbaikan')->default(0)->after('jumlah_rusak_berat');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('aset_inventaris', function (Blueprint $table) {
            if (Schema::hasColumn('aset_inventaris', 'jumlah_dalam_perbaikan')) {
                $table->dropColumn('jumlah_dalam_perbaikan');
            }
            if (Schema::hasColumn('aset_inventaris', 'jumlah_rusak_berat')) {
                $table->dropColumn('jumlah_rusak_berat');
            }
            if (Schema::hasColumn('aset_inventaris', 'jumlah_rusak_ringan')) {
                $table->dropColumn('jumlah_rusak_ringan');
            }
            if (Schema::hasColumn('aset_inventaris', 'jumlah_baik')) {
                $table->dropColumn('jumlah_baik');
            }
        });
    }
};
