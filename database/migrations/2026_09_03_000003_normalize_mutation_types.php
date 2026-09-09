<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('asset_mutations')
            ->whereIn('movement_type', ['Mutasi Internal', 'Perbaikan Distribusi'])
            ->update(['movement_type' => 'Pemindahan Unit']);

        Schema::table('asset_mutations', function (Blueprint $table) {
            $table->string('movement_type')->default('Pemindahan Unit')->change();
        });
    }

    public function down(): void
    {
        Schema::table('asset_mutations', function (Blueprint $table) {
            $table->string('movement_type')->default('Mutasi Internal')->change();
        });
    }
};
