<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StasiunIklim extends Model
{
    public $timestamps = false;

    protected $table = 'stasiun_iklim';

    protected $fillable = [
        'kode_wmo',
        'nama_stasiun',
        'lintang',
        'bujur',
        'elevasi_meter',
    ];

    /**
     * Data iklim harian dari stasiun ini.
     */
    public function dataIklimHarian(): HasMany
    {
        return $this->hasMany(DataIklimHarian::class, 'stasiun_id');
    }

    /**
     * Data iklim dasarian dari stasiun ini.
     */
    public function dataIklimDasarian(): HasMany
    {
        return $this->hasMany(DataIklimDasarian::class, 'stasiun_id');
    }
}
