<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function view(User $actor, User $target): bool
    {
        if ($actor->hasRole('super_admin') || $actor->hasRole('admin_pusat')) return true;
        if ($actor->hasRole('admin_unit')) {
            return ($target->unit_id ?? null) === ($actor->unit_id ?? null);
        }

        return false;
    }

    public function create(User $actor): bool
    {
        return $actor->hasRole('super_admin') || $actor->hasRole('admin_pusat');
    }

    public function update(User $actor, User $target): bool
    {
        return $this->view($actor, $target);
    }

    public function delete(User $actor, User $target): bool
    {
        return $this->view($actor, $target);
    }
}
