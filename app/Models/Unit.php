<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Unit extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'leader_name',
        'type',
        'address',
        'status',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function location(): HasOne
    {
        return $this->hasOne(Location::class)->orderBy('name');
    }

    public function locations(): HasMany
    {
        return $this->hasMany(Location::class);
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    public function assets(): HasMany
    {
        return $this->hasMany(AsetInventaris::class, 'unit_id');
    }

    public function outgoingMutations(): HasMany
    {
        return $this->hasMany(AssetMutation::class, 'from_unit_id');
    }

    public function incomingMutations(): HasMany
    {
        return $this->hasMany(AssetMutation::class, 'to_unit_id');
    }

    public function borrowings(): HasMany
    {
        return $this->hasMany(AssetBorrowing::class, 'borrower_unit_id');
    }
}
