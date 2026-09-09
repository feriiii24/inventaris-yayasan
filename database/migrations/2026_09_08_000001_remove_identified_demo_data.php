<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->deleteDemoUsers();
        $this->deleteDemoActivities();
        $this->deleteDemoTransactions();
        $this->deleteDemoAssets();
        $this->deleteDemoStructure();
    }

    public function down(): void
    {
        // Demo records are intentionally not recreated.
    }

    private function deleteDemoUsers(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        DB::table('users')
            ->whereIn('email', [
                'superadmin@yayasan.id',
                'admin1@yayasan.id',
                'admin2@yayasan.id',
            ])
            ->orWhere('email', 'like', 'admin.yayasan%@yayasan.id')
            ->orWhere('email', 'like', 'admin.unit%@yayasan.id')
            ->delete();
    }

    private function deleteDemoActivities(): void
    {
        if (Schema::hasTable('asset_activities')) {
            DB::table('asset_activities')
                ->where('description', 'like', 'Aktivitas demo%')
                ->delete();
        }
    }

    private function deleteDemoTransactions(): void
    {
        if (Schema::hasTable('asset_borrowings')) {
            DB::table('asset_borrowings')
                ->where('notes', 'like', '%demo%')
                ->orWhere('purpose', 'like', 'Keperluan demo%')
                ->delete();
        }

        if (Schema::hasTable('asset_mutations')) {
            DB::table('asset_mutations')
                ->where('notes', 'like', 'Mutasi demo%')
                ->delete();
        }
    }

    private function deleteDemoAssets(): void
    {
        if (Schema::hasTable('aset_inventaris')) {
            DB::table('aset_inventaris')
                ->where('deskripsi', 'like', 'Data inventaris demo%')
                ->orWhere('spesifikasi', 'like', 'Spesifikasi demo%')
                ->delete();
        }

        if (Schema::hasTable('aset_bergerak')) {
            DB::table('aset_bergerak')
                ->where('keterangan', 'like', 'Aset bergerak demo%')
                ->delete();
        }

        if (Schema::hasTable('aset_tidak_bergerak')) {
            DB::table('aset_tidak_bergerak')
                ->where('keterangan', 'like', 'Aset tidak bergerak demo%')
                ->delete();
        }

        if (Schema::hasTable('usaha_yayasan')) {
            DB::table('usaha_yayasan')
                ->where('keterangan', 'like', 'Usaha yayasan demo%')
                ->delete();
        }

        if (Schema::hasTable('assets')) {
            $demoAssetIds = DB::table('assets')
                ->where('description', 'like', '%Demo%')
                ->pluck('id');

            if ($demoAssetIds->isNotEmpty()) {
                if (Schema::hasTable('asset_borrowings')) {
                    DB::table('asset_borrowings')->whereIn('asset_id', $demoAssetIds)->delete();
                }
                if (Schema::hasTable('asset_mutations')) {
                    DB::table('asset_mutations')->whereIn('asset_id', $demoAssetIds)->delete();
                }
                DB::table('assets')->whereIn('id', $demoAssetIds)->delete();
            }
        }
    }

    private function deleteDemoStructure(): void
    {
        if (!Schema::hasTable('units')) {
            return;
        }

        $demoUnitIds = DB::table('units')
            ->where('name', 'like', 'Unit Demo %')
            ->pluck('id');

        if ($demoUnitIds->isEmpty()) {
            return;
        }

        if (Schema::hasTable('rooms')) {
            DB::table('rooms')->whereIn('unit_id', $demoUnitIds)->delete();
        }
        if (Schema::hasTable('locations')) {
            DB::table('locations')->whereIn('unit_id', $demoUnitIds)->delete();
        }
        DB::table('units')->whereIn('id', $demoUnitIds)->delete();
    }
};
