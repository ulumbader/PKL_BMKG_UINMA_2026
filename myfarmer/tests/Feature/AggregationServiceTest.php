<?php

namespace Tests\Feature;

use App\Models\DataIklimHarian;
use App\Models\StasiunIklim;
use App\Services\AggregationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AggregationServiceTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function hari_hujan_dihitung_mulai_dari_curah_hujan_setengah_milimeter(): void
    {
        $stasiun = StasiunIklim::create([
            'kode_wmo' => '96888',
            'nama_stasiun' => 'Stasiun Agregasi Test',
            'lintang' => -7.90080,
            'bujur' => 112.59790,
            'elevasi_meter' => 590,
        ]);

        foreach ([0.0, 0.4, 0.5, 1.0] as $index => $curahHujan) {
            DataIklimHarian::create([
                'stasiun_id' => $stasiun->id,
                'tanggal' => sprintf('2026-01-%02d', $index + 1),
                'curah_hujan_mm' => $curahHujan,
                'kode_status' => 'normal',
                'sumber_data' => 'manual',
            ]);
        }

        $hasil = app(AggregationService::class)->generateDasarian(
            $stasiun->id,
            2026,
            1,
            1
        );

        $this->assertSame(2, $hasil->jumlah_hari_hujan);
        $this->assertSame('1.9', $hasil->total_curah_hujan_mm);
    }
}
