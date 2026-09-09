<?php

namespace App\Http\Controllers;

use App\Models\AssetActivity;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class ActivityController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $rows = [];

        if (!Schema::hasTable('asset_activities')) {
            Schema::create('asset_activities', function ($table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('action');
                $table->string('subject_type')->nullable();
                $table->unsignedBigInteger('subject_id')->nullable();
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        $query = AssetActivity::with('user')->latest();
        if ($user && $user->hasRole('admin_unit')) {
            $query->whereHas('user', fn ($q) => $q->where('unit_id', $user->unit_id));
        }

        $rows = $query->get()->map(fn ($activity, $index) => [
            'id' => (string) $activity->id,
            'time' => $activity->created_at?->format('H:i') ?? '00:00',
            'user' => $activity->user?->name ?? 'Sistem',
            'message' => $activity->description ?? 'Aktivitas sistem',
            'type' => match ($activity->action) {
                'create' => 'Tambah',
                'update' => 'Update',
                'delete' => 'Hapus',
                'mutasi' => 'Mutasi',
                'request' => 'Pengajuan',
                'approval' => 'Approval',
                'rejection' => 'Penolakan',
                'report' => 'Laporan',
                default => 'Aktivitas',
            },
        ]);

        return Inertia::render('Activity/Index', ['activities' => $rows]);
    }
}
