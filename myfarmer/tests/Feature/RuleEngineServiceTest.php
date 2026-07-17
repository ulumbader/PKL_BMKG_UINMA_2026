<?php

namespace Tests\Feature;

use App\Models\DataIklimDasarian;
use App\Models\Role;
use App\Models\RuleRekomendasi;
use App\Models\StasiunIklim;
use App\Models\User;
use App\Services\RuleEngineService;
use Carbon\Carbon;
use Database\Seeders\RuleRekomendasiSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RuleEngineServiceTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    private StasiunIklim $stasiun;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create([
            'nama_role' => 'super_admin',
            'deskripsi' => 'Super Administrator',
        ]);

        $this->superAdmin = User::create([
            'role_id' => $role->id,
            'nama_lengkap' => 'Super Admin Rule Test',
            'email' => 'superadmin-rule@test.com',
            'password' => 'password123',
            'is_active' => true,
        ]);

        $this->stasiun = StasiunIklim::create([
            'kode_wmo' => '96999',
            'nama_stasiun' => 'Stasiun Rule Test',
            'lintang' => -7.90080,
            'bujur' => 112.59790,
            'elevasi_meter' => 590,
        ]);
    }

    /** @test */
    public function kriteria_utama_dan_hari_hujan_menghasilkan_optimal_tanam(): void
    {
        $this->buatRule('Rule dengan HH', true);
        $target = $this->buatJendelaDasarian([50, 60, 70], [3, 4, 5]);

        $hasil = app(RuleEngineService::class)->evaluate($target->id)[0];

        $this->assertSame('optimal_tanam', $hasil->status_rekomendasi);
        $this->assertStringContainsString('kriteria utama', $hasil->catatan_teknis);
        $this->assertStringContainsString('Kriteria HH juga terpenuhi', $hasil->catatan_teknis);
    }

    /** @test */
    public function kriteria_alternatif_lulus_saat_total_mencapai_150_mm(): void
    {
        $this->buatRule('Rule alternatif', true);
        $target = $this->buatJendelaDasarian([80, 30, 40], [3, 3, 3]);

        $hasil = app(RuleEngineService::class)->evaluate($target->id)[0];

        $this->assertSame('optimal_tanam', $hasil->status_rekomendasi);
        $this->assertStringContainsString('kriteria alternatif', $hasil->catatan_teknis);
        $this->assertStringContainsString('total CH 150mm >= 150mm', $hasil->catatan_teknis);
    }

    /** @test */
    public function toggle_hari_hujan_memungkinkan_perbandingan_dua_rule(): void
    {
        $ruleDenganHh = $this->buatRule('Rule dengan HH', true);
        $ruleTanpaHh = $this->buatRule('Rule tanpa HH', false);
        $target = $this->buatJendelaDasarian([50, 50, 50], [3, 2, 3]);

        $hasil = collect(app(RuleEngineService::class)->evaluate($target->id))->keyBy('rule_id');

        $this->assertSame('tunggu', $hasil[$ruleDenganHh->id]->status_rekomendasi);
        $this->assertStringContainsString('kriteria HH tidak terpenuhi', $hasil[$ruleDenganHh->id]->catatan_teknis);
        $this->assertSame('optimal_tanam', $hasil[$ruleTanpaHh->id]->status_rekomendasi);
        $this->assertStringContainsString('Kriteria HH dinonaktifkan', $hasil[$ruleTanpaHh->id]->catatan_teknis);
    }

    /** @test */
    public function total_alternatif_yang_belum_terpenuhi_menghasilkan_tunggu_jika_ch_terkini_cukup(): void
    {
        $this->buatRule('Rule total kurang', false);
        $target = $this->buatJendelaDasarian([60, 30, 50], [3, 3, 3]);

        $hasil = app(RuleEngineService::class)->evaluate($target->id)[0];

        $this->assertSame('tunggu', $hasil->status_rekomendasi);
        $this->assertStringContainsString('total CH 140mm', $hasil->catatan_teknis);
    }

    /** @test */
    public function ch_terkini_rendah_dan_total_alternatif_gagal_menghasilkan_tidak_disarankan(): void
    {
        $this->buatRule('Rule tidak disarankan', false);
        $target = $this->buatJendelaDasarian([60, 30, 40], [3, 3, 3]);

        $hasil = app(RuleEngineService::class)->evaluate($target->id)[0];

        $this->assertSame('tidak_disarankan', $hasil->status_rekomendasi);
        $this->assertStringContainsString('total CH 130mm', $hasil->catatan_teknis);
    }

    /** @test */
    public function data_dasarian_yang_belum_lengkap_menghasilkan_tunggu(): void
    {
        $this->buatRule('Rule data kurang', true);
        $target = $this->buatDasarian(2026, 1, 1, 70, 4);

        $hasil = app(RuleEngineService::class)->evaluate($target->id)[0];

        $this->assertSame('tunggu', $hasil->status_rekomendasi);
        $this->assertStringContainsString('Dibutuhkan 3 dasarian, tersedia 1', $hasil->catatan_teknis);
    }

    /** @test */
    public function urutan_kronologis_tetap_benar_saat_melintasi_pergantian_tahun(): void
    {
        $this->buatRule('Rule lintas tahun', true);
        $this->buatDasarian(2025, 12, 3, 60, 3);
        $this->buatDasarian(2026, 1, 1, 40, 3);
        $target = $this->buatDasarian(2026, 1, 2, 50, 3);

        $hasil = app(RuleEngineService::class)->evaluate($target->id)[0];

        $this->assertSame('optimal_tanam', $hasil->status_rekomendasi);
        $this->assertStringContainsString('kriteria alternatif', $hasil->catatan_teknis);
        $this->assertStringContainsString('D3 12/2025', $hasil->catatan_teknis);
    }

    /** @test */
    public function endpoint_rule_mewajibkan_seluruh_parameter_metodologi_baru(): void
    {
        $token = $this->superAdmin->createToken('rule-test')->plainTextToken;

        $responseTidakLengkap = $this->withToken($token)->postJson('/api/admin/rules', [
            'nama_rule' => 'Rule tidak lengkap',
            'parameter' => [
                'min_curah_hujan_dasarian' => 50,
                'min_dasarian_berturut' => 3,
            ],
        ]);

        $responseTidakLengkap->assertStatus(422)
            ->assertJsonValidationErrors([
                'parameter.total_alternatif_mm',
                'parameter.pakai_kriteria_hari_hujan',
                'parameter.min_hari_hujan_dasarian',
            ]);

        $responseLengkap = $this->withToken($token)->postJson('/api/admin/rules', [
            'nama_rule' => 'Rule lengkap',
            'parameter' => $this->parameterRule(true),
        ]);

        $responseLengkap->assertCreated()
            ->assertJsonPath('data.parameter.total_alternatif_mm', 150)
            ->assertJsonPath('data.parameter.pakai_kriteria_hari_hujan', true)
            ->assertJsonPath('data.parameter.min_hari_hujan_dasarian', 3);
    }

    /** @test */
    public function seeder_rule_default_memuat_parameter_kriteria_baru(): void
    {
        $this->seed(RuleRekomendasiSeeder::class);

        $rule = RuleRekomendasi::where('nama_rule', 'Rule Awal Musim Tanam')->firstOrFail();

        $this->assertSame(50, $rule->parameter['min_curah_hujan_dasarian']);
        $this->assertSame(3, $rule->parameter['min_dasarian_berturut']);
        $this->assertSame(150, $rule->parameter['total_alternatif_mm']);
        $this->assertTrue($rule->parameter['pakai_kriteria_hari_hujan']);
        $this->assertSame(3, $rule->parameter['min_hari_hujan_dasarian']);
    }

    /** @test */
    public function migration_data_melengkapi_parameter_rule_existing_tanpa_mengubah_skema(): void
    {
        $rule = RuleRekomendasi::create([
            'nama_rule' => 'Rule Awal Musim Tanam',
            'deskripsi' => 'Format parameter lama.',
            'parameter' => [
                'min_curah_hujan_dasarian' => 50,
                'min_dasarian_berturut' => 3,
            ],
            'is_active' => true,
            'dibuat_oleh' => $this->superAdmin->id,
            'diubah_oleh' => $this->superAdmin->id,
        ]);

        $migration = require database_path(
            'migrations/2026_07_16_000015_expand_rule_rekomendasi_parameters.php'
        );
        $migration->up();
        $rule->refresh();

        $this->assertSame(150, $rule->parameter['total_alternatif_mm']);
        $this->assertTrue($rule->parameter['pakai_kriteria_hari_hujan']);
        $this->assertSame(3, $rule->parameter['min_hari_hujan_dasarian']);
    }

    private function buatRule(string $nama, bool $pakaiHariHujan): RuleRekomendasi
    {
        return RuleRekomendasi::create([
            'nama_rule' => $nama,
            'deskripsi' => 'Rule untuk pengujian.',
            'parameter' => $this->parameterRule($pakaiHariHujan),
            'is_active' => true,
            'dibuat_oleh' => $this->superAdmin->id,
            'diubah_oleh' => $this->superAdmin->id,
        ]);
    }

    /**
     * @return array<string, int|bool>
     */
    private function parameterRule(bool $pakaiHariHujan): array
    {
        return [
            'min_curah_hujan_dasarian' => 50,
            'min_dasarian_berturut' => 3,
            'total_alternatif_mm' => 150,
            'pakai_kriteria_hari_hujan' => $pakaiHariHujan,
            'min_hari_hujan_dasarian' => 3,
        ];
    }

    /**
     * @param  array<int, int|float>  $curahHujan
     * @param  array<int, int>  $hariHujan
     */
    private function buatJendelaDasarian(array $curahHujan, array $hariHujan): DataIklimDasarian
    {
        $target = null;

        foreach ($curahHujan as $index => $nilai) {
            $target = $this->buatDasarian(2026, 1, $index + 1, $nilai, $hariHujan[$index]);
        }

        return $target;
    }

    private function buatDasarian(
        int $tahun,
        int $bulan,
        int $dasarianKe,
        float $curahHujan,
        int $hariHujan
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
            'total_curah_hujan_mm' => $curahHujan,
            'jumlah_hari_hujan' => $hariHujan,
            'jumlah_hari_valid' => 10,
            'jumlah_hari_missing' => 0,
            'status_musim' => 'normal',
            'dihitung_pada' => now(),
        ]);
    }
}
