<?php

namespace App\Http\Controllers;

use App\Models\AssetActivity;
use Illuminate\Support\Facades\Schema;
use Illuminate\Routing\Controller as BaseController;

abstract class Controller extends BaseController
{
    /**
     * Apply per-unit filter for admin_unit users.
     * Accepts an Eloquent query builder and adds a where clause if the
     * authenticated user has role 'admin_unit'.
     */
    protected function applyUnitFilter($query)
    {
        $user = auth()->user();
        if ($user && $user->hasRole('admin_unit')) {
            $table = $query->getModel()->getTable();
            if (Schema::hasColumn($table, 'unit_id')) {
                $query->where($table . '.unit_id', $user->unit_id);
            } elseif (Schema::hasColumn($table, 'unitId')) {
                $query->where($table . '.unitId', $user->unit_id);
            }
        }

        return $query;
    }

    protected function logActivity(string $action, string $description, ?string $subjectType = null, ?int $subjectId = null, ?int $userId = null): void
    {
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

        AssetActivity::create([
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'description' => $description,
        ]);
    }
}
