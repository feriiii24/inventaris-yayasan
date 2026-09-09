<?php

namespace App\Policies;

use App\Models\AssetBorrowing;
use App\Models\User;

class AssetBorrowingPolicy
{
    public function view(User $user, AssetBorrowing $borrowing): bool
    {
        if ($user->hasRole('super_admin') || $user->hasRole('admin_pusat')) return true;
        if ($user->hasRole('admin_unit')) {
            return ($borrowing->borrower_unit_id ?? null) === ($user->unit_id ?? null);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('super_admin') || $user->hasRole('admin_pusat') || $user->hasRole('admin_unit');
    }

    public function update(User $user, AssetBorrowing $borrowing): bool
    {
        return $this->view($user, $borrowing);
    }

    public function delete(User $user, AssetBorrowing $borrowing): bool
    {
        return $this->view($user, $borrowing);
    }
}
