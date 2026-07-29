<?php

namespace Tests\Feature;

use App\Models\KontenLandingPage;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaKontenTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        $role = Role::create(['nama_role' => 'admin', 'deskripsi' => 'Administrator']);
        $this->admin = User::create([
            'role_id' => $role->id,
            'nama_lengkap' => 'Admin Media',
            'email' => 'media@test.com',
            'password' => 'password123',
            'is_active' => true,
        ]);
        $this->token = $this->admin->createToken('media_test')->plainTextToken;
    }

    public function test_admin_dapat_membuat_setiap_jenis_media(): void
    {
        $sorotan = $this->withToken($this->token)->post('/api/admin/konten', [
            'judul' => 'Panen Hari Ini',
            'tipe' => 'sorotan',
            'file_media' => UploadedFile::fake()->image('panen.jpg'),
            'alt_text' => 'Petani sedang memanen padi',
            'is_active' => '1',
            'urutan_tampil' => '2',
        ]);
        $sorotan->assertCreated()->assertJsonPath('data.jenis_media', 'image');

        $poster = $this->withToken($this->token)->post('/api/admin/konten', [
            'judul' => 'Poster Edukasi',
            'tipe' => 'poster',
            'file_media' => UploadedFile::fake()->image('poster.png'),
            'url_sumber' => 'https://example.com/poster',
            'is_active' => '1',
        ]);
        $poster->assertCreated()->assertJsonPath('data.tipe', 'poster');

        $pdf = $this->withToken($this->token)->post('/api/admin/konten', [
            'judul' => 'Panduan Tanam',
            'tipe' => 'pdf',
            'file_media' => UploadedFile::fake()->createWithContent('panduan.pdf', "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF"),
            'thumbnail' => UploadedFile::fake()->image('cover.jpg'),
            'url_sumber' => 'https://example.com/panduan',
            'is_active' => '1',
        ]);
        $pdf->assertCreated()->assertJsonPath('data.jenis_media', 'pdf');

        $this->assertDatabaseCount('konten_landing_page', 3);
        foreach (KontenLandingPage::all() as $konten) {
            Storage::disk('public')->assertExists($konten->path_file);
        }
    }

    public function test_file_executable_dan_url_non_http_ditolak(): void
    {
        $response = $this->withToken($this->token)
            ->withHeader('Accept', 'application/json')
            ->post('/api/admin/konten', [
                'judul' => 'File Tidak Aman',
                'tipe' => 'poster',
                'file_media' => UploadedFile::fake()->create('malware.exe', 20, 'application/x-msdownload'),
                'url_sumber' => 'javascript:alert(1)',
            ]);

        $response->assertUnprocessable()
            ->assertJsonPath('status', 'error')
            ->assertJsonValidationErrors(['file_media', 'url_sumber']);
        $this->assertDatabaseCount('konten_landing_page', 0);
    }

    public function test_publik_hanya_menerima_media_aktif_dengan_urutan_benar(): void
    {
        $this->buatMedia('Sorotan Kedua', 'sorotan', 20, true);
        $sorotanPertama = $this->buatMedia('Sorotan Pertama', 'sorotan', 10, true);
        $this->buatMedia('Sorotan Nonaktif', 'sorotan', 1, false);
        $poster = $this->buatMedia('Poster Aktif', 'poster', 5, true);
        $pdf = $this->buatMedia('PDF Aktif', 'pdf', 3, true);

        $response = $this->getJson('/api/publik/media');

        $response->assertOk()
            ->assertJsonPath('data.sorotan.0.id', $sorotanPertama->id)
            ->assertJsonPath('data.poster.0.id', $poster->id)
            ->assertJsonPath('data.pdf.0.id', $pdf->id)
            ->assertJsonCount(2, 'data.sorotan')
            ->assertJsonMissing(['judul' => 'Sorotan Nonaktif'])
            ->assertJsonMissingPath('data.sorotan.0.path_file')
            ->assertJsonMissingPath('data.sorotan.0.dibuat_oleh');
    }

    public function test_file_lama_dibersihkan_saat_diganti_dan_konten_dihapus(): void
    {
        $create = $this->withToken($this->token)->post('/api/admin/konten', [
            'judul' => 'Sorotan Lifecycle',
            'tipe' => 'sorotan',
            'file_media' => UploadedFile::fake()->image('lama.jpg'),
            'thumbnail' => UploadedFile::fake()->image('thumbnail-lama.jpg'),
            'is_active' => '1',
        ])->assertCreated();

        $konten = KontenLandingPage::findOrFail($create->json('data.id'));
        $pathLama = $konten->path_file;
        $thumbnailLama = $konten->path_thumbnail;

        $this->withToken($this->token)->post('/api/admin/konten/'.$konten->id, [
            '_method' => 'PUT',
            'judul' => 'Sorotan Lifecycle Baru',
            'tipe' => 'sorotan',
            'file_media' => UploadedFile::fake()->image('baru.webp'),
            'hapus_thumbnail' => '1',
            'is_active' => '1',
        ])->assertOk();

        $konten->refresh();
        Storage::disk('public')->assertMissing($pathLama);
        Storage::disk('public')->assertMissing($thumbnailLama);
        Storage::disk('public')->assertExists($konten->path_file);
        $pathBaru = $konten->path_file;

        $this->withToken($this->token)
            ->deleteJson('/api/admin/konten/'.$konten->id)
            ->assertOk();

        Storage::disk('public')->assertMissing($pathBaru);
        $this->assertDatabaseMissing('konten_landing_page', ['id' => $konten->id]);
    }

    public function test_konten_teks_lama_tetap_mendukung_update_parsial_dan_endpoint_publik(): void
    {
        $konten = KontenLandingPage::create([
            'judul' => 'Tips Lama',
            'isi' => 'Isi tips lama yang tetap harus tersedia.',
            'tipe' => 'tips',
            'is_active' => true,
            'urutan_tampil' => 1,
            'dibuat_oleh' => $this->admin->id,
        ]);

        $this->withToken($this->token)
            ->putJson('/api/admin/konten/'.$konten->id, ['is_active' => false])
            ->assertOk();

        $this->getJson('/api/publik/konten')
            ->assertOk()
            ->assertJsonMissing(['judul' => 'Tips Lama']);

        $this->withToken($this->token)
            ->putJson('/api/admin/konten/'.$konten->id, ['is_active' => true])
            ->assertOk();

        $this->getJson('/api/publik/konten')
            ->assertOk()
            ->assertJsonFragment([
                'judul' => 'Tips Lama',
                'isi' => 'Isi tips lama yang tetap harus tersedia.',
                'tipe' => 'tips',
            ]);
    }

    private function buatMedia(string $judul, string $tipe, int $urutan, bool $aktif): KontenLandingPage
    {
        return KontenLandingPage::create([
            'judul' => $judul,
            'tipe' => $tipe,
            'jenis_media' => $tipe === 'pdf' ? 'pdf' : 'image',
            'path_file' => 'media/'.$tipe.'/contoh-'.$urutan.'.'.($tipe === 'pdf' ? 'pdf' : 'jpg'),
            'url_sumber' => in_array($tipe, ['poster', 'pdf'], true) ? 'https://example.com/'.$tipe : null,
            'is_active' => $aktif,
            'urutan_tampil' => $urutan,
            'dibuat_oleh' => $this->admin->id,
        ]);
    }
}
