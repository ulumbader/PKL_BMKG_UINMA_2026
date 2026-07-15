<?php

namespace Database\Seeders;

use App\Models\StasiunIklim;
use Illuminate\Database\Seeder;

class StasiunIklimSeeder extends Seeder
{
    /**
     * Seed stasiun iklim utama — Stasiun Klimatologi Karangploso, Jawa Timur.
     */
    public function run(): void
    {
        StasiunIklim::create([
            'kode_wmo'      => '96943',
            'nama_stasiun'  => 'Stasiun Klimatologi Jawa Timur',
            'lintang'       => -7.90080,
            'bujur'         => 112.59790,
            'elevasi_meter' => 590,
        ]);
    }
}
