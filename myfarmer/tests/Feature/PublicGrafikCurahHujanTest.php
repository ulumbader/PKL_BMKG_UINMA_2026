<?php

namespace Tests\Feature;

use App\Models\DataIklimDasarian;
use App\Models\HasilRekomendasi;
use App\Models\Role;
use App\Models\RuleRekomendasi;
use App\Models\StasiunIklim;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicGrafikCurahHujanTest extends TestCase
{
    use RefreshDatabase;

    private StasiunIklim $stasiun;

    private RuleRekomendasi $rule;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create([
            'nama_role' => 'super_admin',
            'deskripsi' => 'Super Administrator',
        ]);

        $user = User::create([
            'role_id' => $role->id,
            'nama_lengkap' => 'Super Admin Grafik',
            'email' => 'grafik@myfarmer.test',
            'password' => 'password123',
            'is_active' => true,
        ]);

        $this->stasiun = StasiunIklim::create([
            'kode_wmo' => '96943',
            'nama_stasiun' => 'Stasiun Klimatologi Jawa Timur',
            'lintang' => -7.90080,
            'bujur' => 112.59790,
            'elevasi_meter' => 590,
        ]);

        $this->rule = RuleRekomendasi::create([
            'nama_rule' => 'Rule Grafik Dinamis',
            'deskripsi' => 'Rule untuk memastikan parameter grafik berasal dari database.',
            'parameter' => [
                'min_curah_hujan_dasarian' => 42.5,
                'min_dasarian_berturut' => 3,
                'total_alternatif_mm' => 150,
                'pakai_kriteria_hari_hujan' => true,
                'min_hari_hujan_dasarian' => 4,
                'mt1_bulan_mulai' => 11,
                'mt1_dasarian_mulai' => 1,
                'mt1_bulan_selesai' => 4,
                'mt1_dasarian_selesai' => 2,
            ],
            'is_active' => true,
            'dibuat_oleh' => $user->id,
            'diubah_oleh' => $user->id,
        ]);
    }

    /** @test */
    public function endpoint_grafik_publik_mengembalikan_periode_kronologis_dan_rekomendasi(): void
    {
        $januariSatu = $this->buatDasarian(2026, 1, 1, 20, 1);
        $januariDua = $this->buatDasarian(2026, 1, 2, 48.5, 4);
        $januariTiga = $this->buatDasarian(2026, 1, 3, 73.2, 6);
        $februariSatu = $this->buatDasarian(2026, 2, 1, 82, 7);

        $this->buatRekomendasi($januariSatu, 'tidak_disarankan');
        $this->buatRekomendasi($januariDua, 'tunggu');
        $this->buatRekomendasi($februariSatu, 'optimal_tanam');

        $response = $this->getJson('/api/publik/grafik-curah-hujan?jumlah_periode=3');

        $response->assertOk()
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'stasiun' => [
                        'nama' => 'Stasiun Klimatologi Jawa Timur',
                        'kode_wmo' => '96943',
                    ],
                    'rule' => [
                        'nama' => 'Rule Grafik Dinamis',
                        'batas_curah_hujan_mm' => 42.5,
                        'jumlah_periode_berturut' => 3,
                        'batas_total_alternatif_mm' => 150,
                        'kriteria_hari_hujan_aktif' => true,
                        'batas_hari_hujan' => 4,
                        'kalender_mt1' => [
                            'mulai' => [
                                'bulan' => 11,
                                'periode_ke' => 1,
                            ],
                            'selesai' => [
                                'bulan' => 4,
                                'periode_ke' => 2,
                            ],
                            'label' => 'November periode 1 sampai April periode 2',
                        ],
                    ],
                    'jumlah_periode' => 3,
                ],
            ])
            ->assertJsonPath('data.periode.0.periode.label', '11–20 Januari 2026')
            ->assertJsonPath('data.periode.0.periode.dalam_mt1', true)
            ->assertJsonPath('data.periode.0.curah_hujan.total_mm', 48.5)
            ->assertJsonPath('data.periode.0.rekomendasi.status', 'tunggu')
            ->assertJsonPath('data.periode.1.periode.label', '21–31 Januari 2026')
            ->assertJsonPath('data.periode.1.rekomendasi.status', null)
            ->assertJsonPath('data.periode.1.rekomendasi.label', 'Belum dianalisis')
            ->assertJsonPath('data.periode.2.periode.label', '1–10 Februari 2026')
            ->assertJsonPath('data.periode.2.rekomendasi.status', 'optimal_tanam')
            ->assertJsonCount(3, 'data.periode');
    }

    /** @test */
    public function endpoint_grafik_menandai_periode_di_luar_mt1(): void
    {
        $this->buatDasarian(2026, 4, 2, 70, 5);
        $this->buatDasarian(2026, 4, 3, 80, 6);

        $response = $this->getJson('/api/publik/grafik-curah-hujan?jumlah_periode=2');

        $response->assertOk()
            ->assertJsonPath('data.periode.0.periode.dalam_mt1', true)
            ->assertJsonPath('data.periode.1.periode.dalam_mt1', false);
    }

    /** @test */
    public function endpoint_grafik_publik_mengembalikan_null_saat_data_dasarian_belum_ada(): void
    {
        $this->getJson('/api/publik/grafik-curah-hujan')
            ->assertOk()
            ->assertJson([
                'status' => 'success',
                'message' => 'Belum ada data curah hujan 10 harian.',
                'data' => null,
            ]);
    }

    /** @test */
    public function endpoint_grafik_publik_tetap_mengembalikan_curah_hujan_saat_rule_belum_ada(): void
    {
        $this->rule->delete();
        $this->buatDasarian(2026, 1, 1, 25, 2);

        $this->getJson('/api/publik/grafik-curah-hujan')
            ->assertOk()
            ->assertJsonPath('data.rule', null)
            ->assertJsonPath('data.jumlah_periode', 1)
            ->assertJsonPath('data.periode.0.periode.dalam_mt1', null)
            ->assertJsonPath('data.periode.0.curah_hujan.total_mm', 25)
            ->assertJsonPath('data.periode.0.rekomendasi.status', null)
            ->assertJsonPath('data.periode.0.rekomendasi.label', 'Belum dianalisis');
    }

    /** @test */
    public function endpoint_grafik_publik_memvalidasi_batas_jumlah_periode_dengan_format_standar(): void
    {
        $this->getJson('/api/publik/grafik-curah-hujan?jumlah_periode=37')
            ->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'Terjadi kesalahan validasi.',
            ])
            ->assertJsonValidationErrors(['jumlah_periode']);
    }

    private function buatDasarian(
        int $tahun,
        int $bulan,
        int $dasarianKe,
        float $totalCurahHujan,
        int $jumlahHariHujan
    ): DataIklimDasarian {
        $tanggalMulai = match ($dasarianKe) {
            1 => Carbon::create($tahun, $bulan, 1),
            2 => Carbon::create($tahun, $bulan, 11),
            3 => Carbon::create($tahun, $bulan, 21),
        };

        $tanggalSelesai = match ($dasarianKe) {
            1 => Carbon::create($tahun, $bulan, 10),
            2 => Carbon::create($tahun, $bulan, 20),
            3 => Carbon::create($tahun, $bulan, 1)->endOfMonth(),
        };

        return DataIklimDasarian::create([
            'stasiun_id' => $this->stasiun->id,
            'tahun' => $tahun,
            'bulan' => $bulan,
            'dasarian_ke' => $dasarianKe,
            'tanggal_mulai' => $tanggalMulai->toDateString(),
            'tanggal_selesai' => $tanggalSelesai->toDateString(),
            'total_curah_hujan_mm' => $totalCurahHujan,
            'jumlah_hari_hujan' => $jumlahHariHujan,
            'jumlah_hari_valid' => $tanggalMulai->diffInDays($tanggalSelesai) + 1,
            'jumlah_hari_missing' => 0,
            'status_musim' => 'normal',
            'dihitung_pada' => Carbon::now(),
        ]);
    }

    private function buatRekomendasi(DataIklimDasarian $dasarian, string $status): void
    {
        HasilRekomendasi::create([
            'dasarian_id' => $dasarian->id,
            'rule_id' => $this->rule->id,
            'status_rekomendasi' => $status,
            'catatan_teknis' => 'Data pengujian grafik.',
            'generated_at' => Carbon::now(),
        ]);
    }
}
