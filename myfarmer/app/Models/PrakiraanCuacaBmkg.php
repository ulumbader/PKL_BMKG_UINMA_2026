<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrakiraanCuacaBmkg extends Model
{
    public $timestamps = false;

    protected $table = 'prakiraan_cuaca_bmkg';

    protected $fillable = [
        'kode_adm4',
        'nama_wilayah',
        'datetime_prakiraan',
        'suhu',
        'curah_hujan_3jam',
        'kelembapan',
        'kecepatan_angin',
        'kondisi_cuaca',
        'analysis_date',
        'fetched_at',
    ];

    protected $casts = [
        'datetime_prakiraan' => 'datetime',
        'suhu' => 'decimal:1',
        'curah_hujan_3jam' => 'decimal:1',
        'kelembapan' => 'decimal:1',
        'kecepatan_angin' => 'decimal:1',
        'analysis_date' => 'datetime',
        'fetched_at' => 'datetime',
    ];
}
