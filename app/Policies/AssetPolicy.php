<?php

namespace App\Policies;

use App\Models\Asset;
use App\Models\User;

class AssetPolicy
{
    public function view(User $user, Asset $asset): bool
    {
        if ($user->hasRole('super_admin') || $user->hasRole('admin_pusat')) return true;
        if ($user->hasRole('admin_unit')) {
            return ($asset->unit_id ?? null) === ($user->unit_id ?? null);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('super_admin') || $user->hasRole('admin_pusat') || $user->hasRole('admin_unit');
    }

    public function update(User $user, Asset $asset): bool
    {
        return $this->view($user, $asset);
    }

    public function delete(User $user, Asset $asset): bool
    {
        return $this->view($user, $asset);
    }
}
