<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'unit_id',
        'role_id',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function activities()
    {
        return $this->hasMany(AssetActivity::class);
    }

    /**
     * Relationship to roles table (one role per user)
     */
    public function roleModel()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Check role — consult role_id relation first, then fall back to legacy column
     */
    public function hasRole(string|array $roles): bool
    {
        $roles = is_array($roles) ? $roles : [$roles];

        try {
            if ($this->relationLoaded('roleModel') && $this->roleModel) {
                return in_array($this->roleModel->name, $roles, true);
            }

            if ($this->roleModel()->exists()) {
                return $this->roleModel()->whereIn('name', $roles)->exists();
            }
        } catch (\Throwable $e) {
            // ignore and fall back
        }

        // legacy fallback to users.role enum column
        return in_array($this->role, $roles, true);
    }

    public function roleLabel(): string
    {
        try {
            if ($this->relationLoaded('roleModel') && $this->roleModel) {
                return $this->roleModel->label ?? ucfirst(str_replace('_', ' ', $this->roleModel->name));
            }

            if ($this->roleModel()->exists()) {
                $r = $this->roleModel()->first();
                return $r->label ?? ucfirst(str_replace('_', ' ', $r->name));
            }
        } catch (\Throwable $e) {
            // ignore
        }

        return match ($this->role) {
            'super_admin' => 'Super Admin',
            'admin_pusat' => 'Admin Pusat',
            'admin_unit' => 'Admin Unit',
            default => 'Pengguna',
        };
    }
}
