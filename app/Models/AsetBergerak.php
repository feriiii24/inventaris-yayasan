<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AsetBergerak extends Model
{
    use HasFactory;

    protected $table = 'aset_bergerak';

    protected $fillable = [
        'bentuk_aset',
        'dasar_hak',
        'atas_nama',
        'tahun_perolehan',
        'nomor_registrasi',
        'foto',
        'dokumen_pdf',
        'keterangan',
    ];

    protected $casts = [
        'tahun_perolehan' => 'integer',
    ];
}
