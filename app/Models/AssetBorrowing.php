<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Schema;

class AssetBorrowing extends Model
{
    use HasFactory;

    protected $table = 'asset_borrowings';

    protected $fillable = [
        'asset_id',
        'quantity',
        'borrower_unit_id',
        'borrower_name',
        'borrower_names',
        'loan_date',
        'loan_time',
        'due_date',
        'due_time',
        'return_date',
        'return_time',
        'purpose',
        'notes',
        'status',
    ];

    protected $casts = [
        'loan_date' => 'date',
        'due_date' => 'date',
        'return_date' => 'date',
        'quantity' => 'integer',
    ];

    public function asset(): BelongsTo
    {
        if (Schema::hasTable('assets')) {
            return $this->belongsTo(Asset::class, 'asset_id');
        }

        return $this->belongsTo(AsetInventaris::class, 'asset_id');
    }

    public function borrowerUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'borrower_unit_id');
    }
}
