<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;

class Asset extends Model
{
    use HasFactory;

    protected $table = 'assets';

    public function getTable()
    {
        if (!Schema::hasTable('assets') && Schema::hasTable('aset_inventaris')) {
            return 'aset_inventaris';
        }

        return $this->table;
    }

    protected $fillable = [
        'asset_category_id',
        'asset_type_id',
        'asset_code',
        'name',
        'description',
        'quantity',
        'unit_measure',
        'acquisition_source',
        'acquisition_year',
        'condition_status',
        'purchase_value',
        'location_id',
        'room_id',
        'unit_id',
        'owner_name',
        'registration_number',
        'legal_basis',
        'start_operation_date',
        'is_movable',
        'metadata',
        'status',
    ];

    protected $casts = [
        'is_movable' => 'boolean',
        'metadata' => 'array',
        'purchase_value' => 'decimal:2',
        'start_operation_date' => 'date',
        'acquisition_year' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'asset_category_id');
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(AssetType::class, 'asset_type_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function mutations(): HasMany
    {
        return $this->hasMany(AssetMutation::class);
    }

    public function borrowings(): HasMany
    {
        return $this->hasMany(AssetBorrowing::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(AssetActivity::class, 'subject_id')->where('subject_type', self::class);
    }
}
