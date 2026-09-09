<?php

namespace App\Policies;

use App\Models\AssetMutation;
use App\Models\User;

class AssetMutationPolicy
{
    public function view(User $user, AssetMutation $mutation): bool
    {
        if ($user->hasRole('super_admin') || $user->hasRole('admin_pusat')) return true;
        if ($user->hasRole('admin_unit')) {
            $from = $mutation->from_unit_id ?? null;
            $to = $mutation->to_unit_id ?? null;
            return $from === $user->unit_id || $to === $user->unit_id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('super_admin') || $user->hasRole('admin_pusat') || $user->hasRole('admin_unit');
    }

    public function update(User $user, AssetMutation $mutation): bool
    {
        return $this->view($user, $mutation);
    }

    public function delete(User $user, AssetMutation $mutation): bool
    {
        return $this->view($user, $mutation);
    }
}
