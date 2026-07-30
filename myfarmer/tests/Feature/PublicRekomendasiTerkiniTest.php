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

class PublicRekomendasiTerkiniTest extends TestCase
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
            'nama_lengkap' => 'Admin Pengujian Rekomendasi',
            'email' => 'rekomendasi-publik@myfarmer.test',
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
            'nama_rule' => 'Rule Awal Musim Tanam',
            'deskripsi' => 'Rule pengujian konteks kalender MT1.',
            'parameter' => [
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
    public function endpoint_rekomendasi_mengirim_keterangan_sederhana_sesuai_status_dan_mt1(): void
    {
        $dalamMt1 = $this->buatDasarian(2026, 1, 1);
        $hasil = HasilRekomendasi::create([
            'dasarian_id' => $dalamMt1->id,
            'rule_id' => $this->rule->id,
            'status_rekomendasi' => 'optimal_tanam',
            'catatan_teknis' => 'Data pengujian rekomendasi publik.',
            'generated_at' => Carbon::now(),
        ]);

        $this->getJson('/api/publik/rekomendasi-terkini')
            ->assertOk()
            ->assertJsonPath('data.kalender_mt1.dalam_mt1', true)
            ->assertJsonPath('data.kalender_mt1.keterangan', 'Sudah memasuki musim tanam')
            ->assertJsonPath('data.kalender_mt1.rentang', 'November periode 1 sampai April periode 2');

        $hasil->update([
            'status_rekomendasi' => 'tunggu',
            'generated_at' => Carbon::now()->addMinute(),
        ]);

        $this->getJson('/api/publik/rekomendasi-terkini')
            ->assertOk()
            ->assertJsonPath(
                'data.kalender_mt1.keterangan',
                'Walaupun sudah memasuki musim tanam, kondisi hujan belum mencukupi'
            );

        $diLuarMt1 = $this->buatDasarian(2025, 10, 3);
        $hasil->update([
            'dasarian_id' => $diLuarMt1->id,
            'status_rekomendasi' => 'optimal_tanam',
            'generated_at' => Carbon::now()->addMinutes(2),
        ]);

        $this->getJson('/api/publik/rekomendasi-terkini')
            ->assertOk()
            ->assertJsonPath('data.kalender_mt1.dalam_mt1', false)
            ->assertJsonPath('data.kalender_mt1.keterangan', 'Di luar musim tanam');
    }

    private function buatDasarian(int $tahun, int $bulan, int $dasarianKe): DataIklimDasarian
    {
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
            'total_curah_hujan_mm' => 100,
            'jumlah_hari_hujan' => 5,
            'jumlah_hari_valid' => $tanggalMulai->diffInDays($tanggalSelesai) + 1,
            'jumlah_hari_missing' => 0,
            'status_musim' => 'basah',
            'dihitung_pada' => Carbon::now(),
        ]);
    }
}
