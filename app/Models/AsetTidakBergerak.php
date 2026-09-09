<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AsetTidakBergerak extends Model
{
    use HasFactory;

    protected $table = 'aset_tidak_bergerak';

    protected $fillable = [
        'bentuk_aset',
        'dasar_hak',
        'atas_nama',
        'tahun_perolehan',
        'jangka_waktu',
        'foto',
        'dokumen_pdf',
        'keterangan',
    ];

    protected $casts = [
        'tahun_perolehan' => 'integer',
    ];
}
