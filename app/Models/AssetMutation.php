<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Schema;

class AssetMutation extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'asset_type',
        'from_unit_id',
        'to_unit_id',
        'from_location_id',
        'to_location_id',
        'from_room_id',
        'to_room_id',
        'movement_type',
        'reference_number',
        'mutation_date',
        'notes',
        'status',
    ];

    protected $casts = [
        'mutation_date' => 'date',
    ];

    public function asset(): BelongsTo
    {
        if (Schema::hasTable('assets')) {
            return $this->belongsTo(Asset::class, 'asset_id');
        }

        return $this->belongsTo(AsetInventaris::class, 'asset_id');
    }

    public function fromUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'from_unit_id');
    }

    public function toUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'to_unit_id');
    }

    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'from_location_id');
    }

    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'to_location_id');
    }

    public function fromRoom(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'from_room_id');
    }

    public function toRoom(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'to_room_id');
    }
}
