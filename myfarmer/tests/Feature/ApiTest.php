<?php

namespace Tests\Feature;

use App\Models\DataIklimHarian;
use App\Models\KontenLandingPage;
use App\Models\Role;
use App\Models\StasiunIklim;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests dasar untuk MyFarmer API.
 *
 * Menguji:
 *   - Login admin sukses/gagal
 *   - Akses endpoint publik tanpa token
 *   - Akses endpoint admin tanpa token ditolak (401)
 *   - Akses endpoint super_admin oleh admin ditolak (403)
 *   - CRUD dasar data_iklim_harian
 *   - Format response API standar
 */
class ApiTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $superAdminUser;
    private Role $adminRole;
    private Role $superAdminRole;
    private StasiunIklim $stasiun;
    private string $adminToken;
    private string $superAdminToken;

    /**
     * Setup data test sebelum setiap test method.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Buat roles
        $this->adminRole = Role::create(['nama_role' => 'admin', 'deskripsi' => 'Administrator']);
        $this->superAdminRole = Role::create(['nama_role' => 'super_admin', 'deskripsi' => 'Super Administrator']);

        // Buat user admin
        $this->adminUser = User::create([
            'role_id'       => $this->adminRole->id,
            'nama_lengkap'  => 'Admin Test',
            'email'         => 'admin@test.com',
            'password'      => 'password123',
            'is_active'     => true,
        ]);

        // Buat user super_admin
        $this->superAdminUser = User::create([
            'role_id'       => $this->superAdminRole->id,
            'nama_lengkap'  => 'Super Admin Test',
            'email'         => 'superadmin@test.com',
            'password'      => 'password123',
            'is_active'     => true,
        ]);

        // Buat stasiun iklim untuk test data iklim
        $this->stasiun = StasiunIklim::create([
            'kode_wmo'      => '96943',
            'nama_stasiun'  => 'Stasiun Klimatologi Jawa Timur',
            'lintang'       => -7.90080,
            'bujur'         => 112.59790,
            'elevasi_meter' => 590,
        ]);

        // Generate tokens
        $this->adminToken = $this->adminUser->createToken('test_token')->plainTextToken;
        $this->superAdminToken = $this->superAdminUser->createToken('test_token')->plainTextToken;
    }

    // =========================================================================
    // LOGIN — Sukses & Gagal
    // =========================================================================

    /** @test */
    public function login_sukses_dengan_kredensial_valid(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email'    => 'admin@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status'  => 'success',
                'message' => 'Login berhasil.',
            ])
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'user' => ['id', 'nama_lengkap', 'email', 'nama_role', 'is_active'],
                    'token',
                ],
            ]);
    }

    /** @test */
    public function login_gagal_dengan_password_salah(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email'    => 'admin@test.com',
            'password' => 'salah_password',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'status'  => 'error',
                'message' => 'Email atau password salah.',
            ]);
    }

    /** @test */
    public function login_gagal_dengan_email_tidak_terdaftar(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email'    => 'tidakada@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'status' => 'error',
            ]);
    }

    /** @test */
    public function login_gagal_validasi_tanpa_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'password' => 'password123',
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function login_gagal_akun_nonaktif(): void
    {
        $this->adminUser->update(['is_active' => false]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'admin@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'status' => 'error',
            ]);
    }

    // =========================================================================
    // ENDPOINT PUBLIK — Bisa diakses tanpa token
    // =========================================================================

    /** @test */
    public function endpoint_publik_cuaca_terkini_tanpa_token_berhasil(): void
    {
        $response = $this->getJson('/api/publik/cuaca-terkini');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);
    }

    /** @test */
    public function endpoint_publik_rekomendasi_terkini_tanpa_token_berhasil(): void
    {
        $response = $this->getJson('/api/publik/rekomendasi-terkini');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);
    }

    /** @test */
    public function endpoint_publik_ringkasan_terkini_tanpa_token_berhasil(): void
    {
        $response = $this->getJson('/api/publik/ringkasan-terkini');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);
    }

    /** @test */
    public function endpoint_publik_konten_tanpa_token_berhasil(): void
    {
        $response = $this->getJson('/api/publik/konten');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);
    }

    // =========================================================================
    // PROTEKSI AUTH — Akses tanpa token ditolak (401)
    // =========================================================================

    /** @test */
    public function endpoint_admin_data_iklim_tanpa_token_ditolak(): void
    {
        $response = $this->getJson('/api/admin/data-iklim');

        $response->assertStatus(401);
    }

    /** @test */
    public function endpoint_admin_agregasi_tanpa_token_ditolak(): void
    {
        $response = $this->getJson('/api/admin/agregasi');

        $response->assertStatus(401);
    }

    /** @test */
    public function endpoint_admin_rules_tanpa_token_ditolak(): void
    {
        $response = $this->getJson('/api/admin/rules');

        $response->assertStatus(401);
    }

    /** @test */
    public function endpoint_admin_ringkasan_tanpa_token_ditolak(): void
    {
        $response = $this->getJson('/api/admin/ringkasan');

        $response->assertStatus(401);
    }

    /** @test */
    public function endpoint_admin_konten_tanpa_token_ditolak(): void
    {
        $response = $this->getJson('/api/admin/konten');

        $response->assertStatus(401);
    }

    /** @test */
    public function endpoint_admin_users_tanpa_token_ditolak(): void
    {
        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(401);
    }

    /** @test */
    public function endpoint_admin_audit_log_tanpa_token_ditolak(): void
    {
        $response = $this->getJson('/api/admin/audit-log');

        $response->assertStatus(401);
    }

    // =========================================================================
    // PROTEKSI ROLE — Admin tidak bisa akses endpoint super_admin (403)
    // =========================================================================

    /** @test */
    public function admin_tidak_bisa_akses_kelola_users(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/users');

        $response->assertStatus(403);
    }

    /** @test */
    public function admin_tidak_bisa_akses_audit_log(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/audit-log');

        $response->assertStatus(403);
    }

    /** @test */
    public function super_admin_bisa_akses_audit_log(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/admin/audit-log');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);
    }

    // =========================================================================
    // CRUD DATA IKLIM HARIAN — Admin
    // =========================================================================

    /** @test */
    public function admin_bisa_list_data_iklim(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/data-iklim');

        $response->assertStatus(200)
            ->assertJson([
                'status'  => 'success',
                'message' => 'Data iklim harian berhasil diambil.',
            ]);
    }

    /** @test */
    public function admin_bisa_store_data_iklim(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/admin/data-iklim', [
                'stasiun_id'     => $this->stasiun->id,
                'tanggal'        => '2026-01-15',
                'curah_hujan_mm' => 12.5,
                'kode_status'    => 'normal',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'status'  => 'success',
                'message' => 'Data iklim harian berhasil disimpan.',
            ]);

        $this->assertDatabaseHas('data_iklim_harian', [
            'stasiun_id'     => $this->stasiun->id,
            'tanggal'        => '2026-01-15',
            'curah_hujan_mm' => 12.5,
            'sumber_data'    => 'manual',
        ]);
    }

    /** @test */
    public function admin_bisa_update_data_iklim(): void
    {
        // Buat data dulu
        $data = DataIklimHarian::create([
            'stasiun_id'     => $this->stasiun->id,
            'tanggal'        => '2026-02-10',
            'curah_hujan_mm' => 5.0,
            'kode_status'    => 'normal',
            'sumber_data'    => 'manual',
            'dibuat_oleh'    => $this->adminUser->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/admin/data-iklim/{$data->id}", [
                'curah_hujan_mm' => 15.0,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status'  => 'success',
                'message' => 'Data iklim harian berhasil diperbarui.',
            ]);

        $this->assertDatabaseHas('data_iklim_harian', [
            'id'             => $data->id,
            'curah_hujan_mm' => 15.0,
        ]);
    }

    /** @test */
    public function admin_bisa_delete_data_iklim(): void
    {
        $data = DataIklimHarian::create([
            'stasiun_id'     => $this->stasiun->id,
            'tanggal'        => '2026-03-05',
            'curah_hujan_mm' => 8.0,
            'kode_status'    => 'normal',
            'sumber_data'    => 'manual',
            'dibuat_oleh'    => $this->adminUser->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->deleteJson("/api/admin/data-iklim/{$data->id}");

        $response->assertStatus(200)
            ->assertJson([
                'status'  => 'success',
                'message' => 'Data iklim harian berhasil dihapus.',
            ]);

        $this->assertDatabaseMissing('data_iklim_harian', [
            'id' => $data->id,
        ]);
    }

    /** @test */
    public function store_data_iklim_validasi_gagal_tanpa_stasiun(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/admin/data-iklim', [
                'tanggal'        => '2026-01-15',
                'curah_hujan_mm' => 12.5,
            ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function store_data_iklim_duplikat_stasiun_tanggal_ditolak(): void
    {
        // Buat data pertama
        DataIklimHarian::create([
            'stasiun_id'     => $this->stasiun->id,
            'tanggal'        => '2026-04-01',
            'curah_hujan_mm' => 10.0,
            'kode_status'    => 'normal',
            'sumber_data'    => 'manual',
            'dibuat_oleh'    => $this->adminUser->id,
        ]);

        // Coba buat duplikat
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/admin/data-iklim', [
                'stasiun_id'     => $this->stasiun->id,
                'tanggal'        => '2026-04-01',
                'curah_hujan_mm' => 20.0,
            ]);

        $response->assertStatus(422);
    }

    // =========================================================================
    // FORMAT RESPONSE — Verifikasi standar
    // =========================================================================

    /** @test */
    public function response_sukses_mengikuti_format_standar(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/data-iklim');

        $response->assertJsonStructure([
            'status',
            'message',
            'data',
        ]);

        $this->assertEquals('success', $response->json('status'));
    }

    /** @test */
    public function response_error_mengikuti_format_standar(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email'    => 'admin@test.com',
            'password' => 'salah_password',
        ]);

        $response->assertJsonStructure([
            'status',
            'message',
        ]);

        $this->assertEquals('error', $response->json('status'));
    }

    // =========================================================================
    // PRAKIRAAN CUACA — Endpoint baru Tahap 12
    // =========================================================================

    /** @test */
    public function endpoint_publik_prakiraan_cuaca_tanpa_token_berhasil(): void
    {
        $response = $this->getJson('/api/publik/prakiraan-cuaca');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);
    }

    /** @test */
    public function endpoint_admin_prakiraan_cuaca_fetch_tanpa_token_ditolak(): void
    {
        $response = $this->postJson('/api/admin/prakiraan-cuaca/fetch');

        $response->assertStatus(401);
    }

    /** @test */
    public function admin_bisa_akses_endpoint_fetch_prakiraan_cuaca(): void
    {
        // Test ini hanya memastikan endpoint bisa diakses oleh admin
        // (tidak benar-benar memanggil API BMKG karena kode adm4 placeholder)
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/admin/prakiraan-cuaca/fetch');

        // Menerima 201 (berhasil fetch) ATAU 502 (API BMKG gagal/kode adm4 salah)
        // Keduanya valid karena tidak crash — error handling bekerja
        $this->assertContains($response->status(), [201, 502]);
        $response->assertJsonStructure(['status', 'message']);
    }
}
