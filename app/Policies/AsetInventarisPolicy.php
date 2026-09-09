<?php

namespace App\Policies;

use App\Models\AsetInventaris;
use App\Models\User;

class AsetInventarisPolicy
{
    public function view(User $user, AsetInventaris $aset): bool
    {
        if ($user->hasRole('super_admin') || $user->hasRole('admin_pusat')) return true;
        if ($user->hasRole('admin_unit')) {
            return ($aset->unit_id ?? null) === ($user->unit_id ?? null);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('super_admin') || $user->hasRole('admin_pusat') || $user->hasRole('admin_unit');
    }

    public function update(User $user, AsetInventaris $aset): bool
    {
        return $this->view($user, $aset);
    }

    public function delete(User $user, AsetInventaris $aset): bool
    {
        return $this->view($user, $aset);
    }
}
