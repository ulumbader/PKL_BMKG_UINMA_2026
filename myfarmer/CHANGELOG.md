# CHANGELOG — MyFarmer Backend

Semua perubahan penting pada backend proyek MyFarmer dicatat di file ini. CLAUDE WAJIB membaca file ini di awal setiap sesi dan menambahkan entry baru di setiap akhir sesi (lihat aturan di `AGENTS.md` bagian 7).

Format tanggal: YYYY-MM-DD.

---

## [Unreleased]

## [Tahap 21] - Perbaikan Periode Proses Agregasi - 2026-07-15
### Ditambahkan
- Endpoint `GET /api/admin/agregasi/periode-tersedia` untuk mengambil metadata tahun dan bulan langsung dari `data_iklim_harian`, serta tahun hasil dari `data_iklim_dasarian`.
- `PeriodeAgregasiRequest` untuk validasi filter stasiun pada endpoint metadata periode.
- Enam feature test untuk autentikasi endpoint, periode sumber, filter stasiun, penolakan periode kosong/parsial, dan proses agregasi valid.

### Diubah
- `ProsesAgregatRequest` memvalidasi keberadaan data harian pada setiap dasarian sebelum proses menulis hasil agregasi.
- Route dan dokumentasi API diperbarui untuk endpoint periode tersedia; total endpoint menjadi 39.

### File Terkait
- `app/Http/Controllers/Api/AggregationController.php`
- `app/Http/Requests/Admin/PeriodeAgregasiRequest.php`
- `app/Http/Requests/Admin/ProsesAgregatRequest.php`
- `routes/api.php`
- `tests/Feature/ApiTest.php`
- `../API_DOCUMENTATION.md`
- `CHANGELOG.md`

### Catatan
- Periode proses tidak lagi bergantung pada isi tabel hasil agregasi, sehingga tahun data harian tetap tersedia saat belum ada satu pun hasil dasarian.
- Request agregasi untuk dasarian tanpa data harian membalas HTTP 422 dan tidak membuat hasil `0 mm` yang menyesatkan.
- Verifikasi berhasil: `php artisan test` (38 test, 88 assertion) dan route agregasi menampilkan 3 endpoint.

## [Tahap 20] - Konfigurasi Monorepo dan Kolaborasi GitHub - 2026-07-15
### Ditambahkan
- README dan panduan kontribusi pada root monorepo.
- Konfigurasi Git bersama, normalisasi line ending, template pull request, serta template issue GitHub.

### Diubah
- `API_DOCUMENTATION.md` dan `DB_DOCUMENTATION.md` dipindahkan dari backend ke root monorepo.
- README backend dan template environment diperbarui untuk setup tim.
- Referensi dokumentasi database pada `AGENTS.md` diarahkan ke root monorepo.

### File Terkait
- `../README.md`
- `../CONTRIBUTING.md`
- `../API_DOCUMENTATION.md`
- `../DB_DOCUMENTATION.md`
- `README.md`
- `.env.example`
- `AGENTS.md`
- `CHANGELOG.md`

### Catatan
- Repository Git tunggal diinisialisasi dari root monorepo; metadata Git lama pada frontend dihapus.
- Tidak ada perubahan pada kode aplikasi, dependency, endpoint, migration, atau skema database.

## [Tahap 19] - Dokumentasi Endpoint Stasiun Iklim - 2026-07-15
### Ditambahkan
- Dokumentasi lengkap endpoint `GET /api/admin/stasiun`, meliputi middleware, header autentikasi, tujuan endpoint, dan contoh response sukses.

### Diubah
- Daftar isi `API_DOCUMENTATION.md` ditambahkan modul Stasiun Iklim dan penomoran modul berikutnya disesuaikan.
- Tabel ringkasan endpoint diperbarui dari 37 menjadi 38 endpoint.
- `CHANGELOG.md` ditambahkan entry sesi ini.

### File Terkait
- `API_DOCUMENTATION.md`
- `CHANGELOG.md`

### Catatan
- Dokumentasi mengikuti kontrak endpoint aktual: tanpa paginasi, middleware `auth:sanctum` + `role:admin`, dan enam field metadata stasiun.
- Tidak ada perubahan kode aplikasi, route, model, migration, maupun seeder pada tahap dokumentasi ini.

## [Tahap 18] - Endpoint Daftar Stasiun Iklim Admin - 2026-07-15
### Ditambahkan
- `StasiunIklimController` dengan endpoint read-only untuk mengambil seluruh metadata stasiun iklim tanpa paginasi.
- Route `GET /api/admin/stasiun` dengan middleware `auth:sanctum` dan `role:admin`.

### Diubah
- `routes/api.php` ditambahkan import controller dan route daftar stasiun pada blok admin.
- `CHANGELOG.md` ditambahkan entry sesi ini.

### File Terkait
- `app/Http/Controllers/Api/StasiunIklimController.php`
- `routes/api.php`
- `CHANGELOG.md`

### Catatan
- Endpoint mengembalikan field `id`, `kode_wmo`, `nama_stasiun`, `lintang`, `bujur`, dan `elevasi_meter` melalui trait `ApiResponse`.
- Tidak ada perubahan model, migration, maupun seeder.
- Verifikasi berhasil: `php artisan migrate:fresh --seed`, server Laravel pada `127.0.0.1:8000`, login super admin, request authenticated ke endpoint stasiun, dan `php artisan test` (32 test, 66 assertion).
- Endpoint tanpa token membalas HTTP 401; endpoint dengan token membalas status `success` dan data seeder Stasiun Klimatologi Jawa Timur (WMO 96943).

## [Tahap 17] - Optimasi Query List dan History - 2026-07-07
### Ditambahkan
- Migration `2026_07_07_000013_add_query_indexes_for_performance.php` untuk menambah index pada tabel `audit_log`, `log_import_data`, `hasil_rekomendasi`, `ringkasan_ai`, dan `konten_landing_page` agar query filter + sorting lebih efisien saat data membesar.

### Diubah
- `DataIklimHarianController` diubah agar filter tanggal memakai `where` / `whereBetween` pada kolom `DATE`, bukan `whereDate()`, supaya index `tanggal` dan unique `(stasiun_id, tanggal)` tetap bisa dimanfaatkan optimal.
- `AggregationService` diubah agar pembacaan data harian per dasarian memakai `whereBetween('tanggal', ...)` pada kolom asli.
- `RingkasanAiController` diubah agar pengurutan daftar ringkasan memakai `orderBy('status')` lalu `generated_at`, menggantikan `CASE` sort yang lebih sulit dioptimalkan database.
- `CHANGELOG.md` ditambahkan entry sesi ini.

### File Terkait
- `app/Http/Controllers/Api/DataIklimHarianController.php`
- `app/Services/AggregationService.php`
- `app/Http/Controllers/Api/RingkasanAiController.php`
- `database/migrations/2026_07_07_000013_add_query_indexes_for_performance.php`
- `CHANGELOG.md`

### Catatan
- Bentuk response API, route, middleware, dan kredensial dev frontend (`superadmin@myfarmer.test` / `password123`) tidak diubah.
- Optimasi difokuskan ke query yang paling sering melakukan filter tanggal, histori, dan sort publik/admin, tanpa mengubah perilaku fitur di frontend.

## [Tahap 16] - Verifikasi Respons API Groq - 2026-07-06
### Ditambahkan
- Tidak ada file/fitur baru. Tahap ini hanya menjalankan verifikasi koneksi dan respons API Groq.

### Diubah
- `CHANGELOG.md` ditambahkan entry hasil pengujian API Groq sesi ini.

### File Terkait
- `.env`
- `app/Services/GroqService.php`
- `CHANGELOG.md`

### Catatan
- Pengujian direct HTTP ke `https://api.groq.com/openai/v1/chat/completions` dengan model `openai/gpt-oss-120b` berhasil merespons.
- Uji awal dengan `max_tokens=20` menghasilkan HTTP sukses tetapi `message.content` kosong karena `finish_reason=length` dan token habis di reasoning.
- Uji ulang dengan `max_tokens=120` berhasil mengembalikan teks final `OK GROQ` dengan `finish_reason=stop`.
- Verifikasi lewat bootstrap Laravel + `GroqService` juga berhasil menghasilkan ringkasan Bahasa Indonesia, sehingga wiring aplikasi ke provider Groq terkonfirmasi berjalan.

## [Tahap 15] - Migrasi Provider AI ke Groq - 2026-07-06
### Ditambahkan
- `GroqService` (`app/Services/GroqService.php`) — service baru untuk generate ringkasan AI lewat Groq Chat Completions API dengan model `openai/gpt-oss-120b`. Tetap mempertahankan fallback ringkasan template jika request gagal.
- Variabel environment `GROQ_API_KEY` dan `GROQ_MODEL` ditambahkan ke `.env` dan `.env.example`.

### Diubah
- `RingkasanAiController` diubah untuk memakai `GroqService` sebagai provider ringkasan AI.
- `config/services.php` diubah dari konfigurasi `gemini` ke `groq`.
- `AGENTS.md`, `API_DOCUMENTATION.md`, dan `DB_DOCUMENTATION.md` diperbarui agar referensi provider AI sekarang konsisten ke Groq.
- `routes/api.php` diperbarui pada komentar section ringkasan AI.

### File Terkait
- `app/Services/GroqService.php`
- `app/Http/Controllers/Api/RingkasanAiController.php`
- `config/services.php`
- `.env`
- `.env.example`
- `AGENTS.md`
- `API_DOCUMENTATION.md`
- `DB_DOCUMENTATION.md`
- `routes/api.php`
- `CHANGELOG.md`

### Catatan
- Provider Gemini lama dilepas dari jalur generate ringkasan AI; request sekarang dikirim ke `https://api.groq.com/openai/v1/chat/completions` dengan header bearer token `GROQ_API_KEY`.
- Model default diset ke `openai/gpt-oss-120b` lewat `GROQ_MODEL` agar bisa diganti tanpa edit kode.
- Endpoint dan format response tidak berubah; hanya provider AI di belakang layar yang diganti.

## [Tahap 14] - Dokumentasi Database untuk Laporan Akademik - 2026-07-05
### Ditambahkan
- `DB_DOCUMENTATION.md` (root project) — dokumentasi database lengkap untuk kebutuhan laporan akademik proyek PKL. Mencakup:
  - Ringkasan umum database dan arsitektur data berlapis (raw → aggregated → rule engine → AI summary)
  - Daftar 15 tabel beserta kategori (inti proyek, logging/audit, bawaan Laravel)
  - Penjelasan detail setiap tabel: nama, fungsi, daftar kolom, tipe data, primary key, foreign key, constraint, index, timestamp, soft delete
  - Relasi antar tabel: 12 relasi one-to-many, 1 relasi one-to-one, 13 relasi inverse (belongsTo), penjelasan tabel standalone
  - ERD database dalam format Mermaid `erDiagram` dengan seluruh 15 tabel dan relasi
  - Penjelasan ERD: alur data inti (pipeline rekomendasi), tabel pendukung, peran tabel users
  - Catatan tambahan: seeder (4 seeder + urutan eksekusi), factory (1 factory bawaan Laravel), nilai enum/status (7 kolom enum), aturan cascade delete (14 FK dengan penjelasan ON DELETE), nullable fields penting, unique constraints, index tambahan, observer audit log, aturan penting lainnya

### File Terkait
- `DB_DOCUMENTATION.md`
- `CHANGELOG.md` (diubah — entry ini)

### Catatan
- Dokumentasi dibuat 100% berdasarkan analisis kode aktual: 16 file migration, 12 file model Eloquent, 5 file seeder, dan 1 file factory
- Tidak ada file kode yang diubah (migration, model, controller, route, dll.) — hanya membuat file dokumentasi baru
- Format dokumentasi menggunakan Markdown akademik dengan tabel terstruktur dan diagram ERD Mermaid
- ERD menampilkan seluruh 15 tabel termasuk 3 tabel bawaan Laravel (personal_access_tokens, password_reset_tokens, failed_jobs) untuk kelengkapan

---

## [Tahap 13] - Testing Endpoint API - 2026-07-05
### Ditambahkan
- Tidak ada file/fitur baru. Tahap ini hanya menjalankan pengujian endpoint API.

### Diubah
- `CHANGELOG.md` ditambahkan entry hasil testing endpoint API sesi ini.

### File Terkait
- `CHANGELOG.md`
- `routes/api.php` (diverifikasi via `php artisan route:list --path=api`)
- `tests/Feature/ApiTest.php` (dijalankan via PHPUnit)

### Catatan
- `php artisan route:list --path=api` berhasil menampilkan **36 route API**, sesuai jumlah endpoint di `API_DOCUMENTATION.md`.
- `php artisan test --filter ApiTest` berhasil: **30 passed, 0 failed** (64 assertions, durasi ~17.61 detik).
- `php artisan test` berhasil: **32 passed, 0 failed** (66 assertions, durasi ~11.26 detik).
- Smoke test HTTP runtime berhasil: `php artisan serve --host=127.0.0.1 --port=8001` lalu `GET /api/publik/konten` membalas **200** dengan JSON standar.
- Tidak ada perubahan kode aplikasi pada tahap ini.

---

## [Tahap 12] - Integrasi API Prakiraan Cuaca Real-Time - 2026-07-05
### Ditambahkan
- `PrakiraanCuacaService` (`app/Services/PrakiraanCuacaService.php`) — service class untuk fetch dan simpan data prakiraan cuaca real-time dari API publik BMKG. Method `fetchAndStore(string $kodeAdm4)`:
  - HTTP GET ke `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode}` via Laravel HTTP Client (Guzzle)
  - Parsing response JSON nested: `data[].cuaca[][]` → array slot prakiraan per 3 jam
  - Mapping field BMKG ke kolom database: `t` → suhu, `tp` → curah_hujan_3jam, `hu` → kelembapan, `ws` → kecepatan_angin, `weather_desc` → kondisi_cuaca, `analysis_date` → analysis_date
  - Upsert ke `prakiraan_cuaca_bmkg` berdasarkan unique constraint `(kode_adm4, datetime_prakiraan)` — fetch ulang tidak duplikat
  - Set `fetched_at` ke waktu saat ini
  - Error handling lengkap: `ConnectionException` (timeout/jaringan), HTTP error codes, empty response, error per-slot — TIDAK pernah crash
  - Semua error di-log ke `storage/logs/laravel.log`
  - Return ringkasan: `{sukses, gagal, nama_wilayah, kode_adm4, error?}`
- `PrakiraanCuacaController` (`app/Http/Controllers/Api/PrakiraanCuacaController.php`) — controller admin untuk trigger fetch prakiraan cuaca. Method `fetch()`: baca kode_adm4 dari `config('myfarmer.kode_adm4_default')`, panggil service, return ringkasan. Middleware `['auth:sanctum', 'role:admin']`
- `PrakiraanCuacaPublicResource` (`app/Http/Resources/PrakiraanCuacaPublicResource.php`) — API Resource untuk response prakiraan cuaca publik. Menampilkan: waktu_prakiraan (WIB), waktu_utc, suhu_celsius, curah_hujan_mm, kelembapan_persen, kecepatan_angin_kmjam, kondisi_cuaca. TIDAK ekspos: id, kode_adm4, analysis_date, fetched_at
- `config/myfarmer.php` — file konfigurasi khusus proyek. Key:
  - `kode_adm4_default`: kode wilayah adm4 default (placeholder `35.07.20.2001`, perlu diganti dengan kode asli Kec. Karangploso)
  - `bmkg_api.base_url`: URL API BMKG (default `https://api.bmkg.go.id/publik/prakiraan-cuaca`)
  - `bmkg_api.timeout`: timeout HTTP (default 30 detik)

### Diubah
- `PublicController` (`app/Http/Controllers/Api/PublicController.php`) — ditambahkan method `cuacaRealtime()`: mengembalikan data prakiraan cuaca terbaru untuk kode_adm4 default, hanya slot yang belum lewat (dari sekarang ke depan), max 24 slot, TANPA middleware auth (Golden Rule #7)
- `routes/api.php` — ditambahkan 2 route baru:
  - `POST /api/admin/prakiraan-cuaca/fetch` (middleware `auth:sanctum`, `role:admin`)
  - `GET /api/publik/prakiraan-cuaca` (tanpa auth, publik)
  - Import `PrakiraanCuacaController` ditambahkan. Komentar header diperbarui
- `tests/Feature/ApiTest.php` — ditambahkan 3 test method baru:
  - `endpoint_publik_prakiraan_cuaca_tanpa_token_berhasil` (200)
  - `endpoint_admin_prakiraan_cuaca_fetch_tanpa_token_ditolak` (401)
  - `admin_bisa_akses_endpoint_fetch_prakiraan_cuaca` (201 atau 502, keduanya valid)

### File Terkait
- `app/Services/PrakiraanCuacaService.php`
- `app/Http/Controllers/Api/PrakiraanCuacaController.php`
- `app/Http/Resources/PrakiraanCuacaPublicResource.php`
- `config/myfarmer.php`
- `app/Http/Controllers/Api/PublicController.php` (diubah)
- `routes/api.php` (diubah)
- `tests/Feature/ApiTest.php` (diubah)

### Catatan
- **Hasil Test:** `php artisan test --filter ApiTest` → **30 passed, 0 failed** (64 assertions, durasi ~13 detik). Semua 27 test lama tetap lulus + 3 test baru prakiraan cuaca
- **TODO PENTING — Kode ADM4 Karangploso:** Nilai `kode_adm4_default` di `config/myfarmer.php` saat ini masih **placeholder** (`35.07.20.2001`). Tim perlu mencari kode ADM4 yang benar untuk salah satu desa di Kec. Karangploso, Kab. Malang melalui:
  - Portal Data Terbuka BMKG
  - Atau coba test endpoint: `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=35.07.20.xxxx`
  - Kode kecamatan Karangploso di Kemendagri: `35.07.20`
  - Setelah ditemukan, set di `.env` sebagai `BMKG_KODE_ADM4=xx.xx.xx.xxxx`
- **Daftar Endpoint Baru:**
  | Method | Path | Middleware | Fungsi |
  |--------|------|-----------|--------|
  | POST | `/api/admin/prakiraan-cuaca/fetch` | `auth:sanctum`, `role:admin` | Trigger fetch prakiraan cuaca dari API BMKG |
  | GET | `/api/publik/prakiraan-cuaca` | — (publik) | Prakiraan cuaca real-time untuk landing page |
- **Total endpoint API sekarang: 36** (34 sebelumnya + 2 baru)
- **Arsitektur data tetap terjaga:** Data prakiraan cuaca TERPISAH di tabel `prakiraan_cuaca_bmkg`, TIDAK dicampur ke `data_iklim_harian`, dan TIDAK dipakai sebagai input rule engine (sesuai AGENTS.md bagian 8a)
- **Endpoint fetch bisa dijadwalkan** lewat Laravel Scheduler nantinya (misal 2x sehari sesuai update BMKG), tinggal buat Artisan Command yang memanggil `PrakiraanCuacaService::fetchAndStore()`
- **Rate limit BMKG:** Max 60 request/menit/IP — tidak masalah karena fetch hanya per beberapa jam sekali
- Tidak ada package baru yang diinstal (menggunakan Laravel HTTP Client bawaan yang berbasis Guzzle)

---

## [Tahap 11] - Finalisasi Dokumentasi dan Testing - 2026-07-05
### Ditambahkan
- `API_DOCUMENTATION.md` (root project) — dokumentasi lengkap seluruh 34 endpoint API, dikelompokkan per fitur (Auth, Kelola User, Data Iklim, Agregasi, Rule Rekomendasi, Evaluasi & Rekomendasi, Ringkasan AI, Konten Landing Page, Log Import, Audit Log, Endpoint Publik). Setiap endpoint mencakup: method, path, middleware, contoh request body, contoh response sukses/gagal, daftar query parameter. Termasuk tabel ringkasan seluruh endpoint di akhir dokumen
- `tests/Feature/ApiTest.php` — Feature test dasar dengan 27 test methods dan 58 assertions, mencakup:
  - Login admin sukses (kredensial valid, response structure, status 200)
  - Login gagal (password salah → 401, email tidak terdaftar → 401, validasi tanpa email → 422, akun nonaktif → 403)
  - Akses 4 endpoint publik tanpa token berhasil (cuaca-terkini, rekomendasi-terkini, ringkasan-terkini, konten → semua 200)
  - Akses 7 endpoint admin tanpa token ditolak (data-iklim, agregasi, rules, ringkasan, konten, users, audit-log → semua 401)
  - Proteksi role: admin tidak bisa akses kelola users (403), admin tidak bisa akses audit log (403), super_admin bisa akses audit log (200)
  - CRUD data_iklim_harian: list (200), store (201 + assertDatabaseHas), update (200 + assertDatabaseHas), delete (200 + assertDatabaseMissing)
  - Validasi: store tanpa stasiun_id (422), store duplikat stasiun+tanggal (422)
  - Format response: sukses mengikuti standar {status, message, data}, error mengikuti standar {status, message}

### File Terkait
- `API_DOCUMENTATION.md`
- `tests/Feature/ApiTest.php`
- `CHANGELOG.md` (diubah — entry ini)

### Catatan
- **Hasil Test:** `php artisan test --filter ApiTest` → **27 passed, 0 failed** (58 assertions, durasi ~5.33 detik)
- **Review Golden Rules:** Seluruh 12 Golden Rules telah diverifikasi terhadap kode Tahap 1–10. **Tidak ditemukan pelanggaran**. Detail:
  | # | Rule | Status |
  |---|---|---|
  | 1 | Backend hanya API (JSON) | ✅ Semua controller return JSON via ApiResponse trait |
  | 2 | Jangan edit migration lama | ✅ Semua migration original utuh |
  | 3 | Update CHANGELOG per sesi | ✅ Entry ini memenuhi |
  | 4 | Nama tabel/kolom Bahasa Indonesia | ✅ Konsisten (data_iklim_harian, curah_hujan_mm, dll) |
  | 5 | Parameter rule dari database | ✅ RuleEngineService baca dari $rule->parameter JSON |
  | 6 | Raw data tidak dihapus/ditimpa oleh agregasi | ✅ AggregationService hanya READ dari harian, WRITE ke dasarian |
  | 7 | Endpoint publik tanpa auth, GET only | ✅ 4 endpoint di /api/publik/* tanpa middleware |
  | 8 | Validasi pakai Form Request class | ✅ 9 Form Request class terpisah |
  | 9 | Format response standar | ✅ ApiResponse trait dipakai konsisten |
  | 10 | Tidak ada package baru tanpa alasan | ✅ Hanya sanctum + guzzle bawaan |
  | 11 | Service class terpisah | ✅ 4 service: AggregationService, RuleEngineService, GeminiService, CsvImportService |
  | 12 | Konvensi penamaan campuran | ✅ Fungsi camelCase Inggris, kolom snake_case Indonesia |
- **PHPUnit config** menggunakan database `myfarmer_testing` (terpisah dari `myfarmer` development) dengan `RefreshDatabase` trait — setiap test berjalan di database bersih
- **Total endpoint API yang sudah dibangun (Tahap 1–10):** 34 endpoint
- Proyek backend MyFarmer siap untuk tahap selanjutnya: integrasi fetch prakiraan cuaca real-time dari API BMKG (Tahap 12, jika diperlukan)

---

## [Tahap 10] - Konten Landing Page, Log Import, dan Audit Log - 2026-07-05
### Ditambahkan
- `KontenLandingPageController` (`app/Http/Controllers/Api/KontenLandingPageController.php`) — CRUD lengkap konten landing page untuk admin. Method: index (paginasi, filter tipe & is_active), show, store (otomatis set dibuat_oleh), update, destroy. Middleware `['auth:sanctum', 'role:admin']`
- `LogImportDataController` (`app/Http/Controllers/Api/LogImportDataController.php`) — read-only endpoint index untuk melihat histori import data BMKG. Filter: status, sumber, tanggal_mulai, tanggal_selesai. Middleware `['auth:sanctum', 'role:admin']`
- `AuditLogController` (`app/Http/Controllers/Api/AuditLogController.php`) — read-only endpoint index audit log khusus super_admin. Filter: user_id, tabel_terkait, aksi, tanggal_mulai, tanggal_selesai. Middleware `['auth:sanctum', 'role:super_admin']`
- `StoreKontenLandingPageRequest` (`app/Http/Requests/Admin/StoreKontenLandingPageRequest.php`) — validasi input buat konten (judul, isi, tipe wajib; is_active, urutan_tampil opsional)
- `UpdateKontenLandingPageRequest` (`app/Http/Requests/Admin/UpdateKontenLandingPageRequest.php`) — validasi update konten (semua field 'sometimes' untuk partial update)
- `AuditLogObserver` (`app/Observers/AuditLogObserver.php`) — observer generik yang otomatis menulis entry ke tabel `audit_log` pada event created/updated/deleted. Mencatat: user_id (via auth()->id()), aksi, tabel_terkait (dari $model->getTable()), id_terkait, detail perubahan (before/after value sebagai JSON untuk update, new values untuk create, old values untuk delete), dan ip_address. Jika tidak ada user yang login (misal proses seeder/console), TIDAK mencatat log (skip silently)

### Diubah
- `app/Providers/EventServiceProvider.php` — didaftarkan `AuditLogObserver` untuk 4 model di method `boot()`:
  - `DataIklimHarian::observe(AuditLogObserver::class)`
  - `RuleRekomendasi::observe(AuditLogObserver::class)`
  - `KontenLandingPage::observe(AuditLogObserver::class)`
  - `RingkasanAi::observe(AuditLogObserver::class)`
- `routes/api.php` — ditambahkan 3 route group baru + import 3 controller baru. Komentar header diperbarui

### File Terkait
- `app/Http/Controllers/Api/KontenLandingPageController.php`
- `app/Http/Controllers/Api/LogImportDataController.php`
- `app/Http/Controllers/Api/AuditLogController.php`
- `app/Http/Requests/Admin/StoreKontenLandingPageRequest.php`
- `app/Http/Requests/Admin/UpdateKontenLandingPageRequest.php`
- `app/Observers/AuditLogObserver.php`
- `app/Providers/EventServiceProvider.php` (diubah)
- `routes/api.php` (diubah)

### Catatan
- **Daftar Endpoint Baru:**
  | Method | Path | Middleware | Fungsi |
  |--------|------|-----------|--------|
  | GET | `/api/admin/konten` | `auth:sanctum`, `role:admin` | List konten landing page (filter: tipe, is_active) |
  | GET | `/api/admin/konten/{id}` | `auth:sanctum`, `role:admin` | Detail satu konten |
  | POST | `/api/admin/konten` | `auth:sanctum`, `role:admin` | Buat konten baru |
  | PUT | `/api/admin/konten/{id}` | `auth:sanctum`, `role:admin` | Update konten |
  | DELETE | `/api/admin/konten/{id}` | `auth:sanctum`, `role:admin` | Hapus konten |
  | GET | `/api/admin/log-import` | `auth:sanctum`, `role:admin` | Histori import data BMKG (read-only) |
  | GET | `/api/admin/audit-log` | `auth:sanctum`, `role:super_admin` | Audit log aktivitas admin (read-only) |
- **Model yang sudah punya Observer audit log:**
  - `DataIklimHarian` — setiap create/update/delete data iklim harian tercatat
  - `RuleRekomendasi` — setiap create/update/delete rule rekomendasi tercatat
  - `KontenLandingPage` — setiap create/update/delete konten landing page tercatat
  - `RingkasanAi` — setiap create/update/delete ringkasan AI tercatat
- **Desain keputusan AuditLogObserver:**
  - Menggunakan satu observer generik (bukan per-model) karena logikanya identik — hanya beda tabel_terkait (diambil otomatis dari `$model->getTable()`)
  - Event `updated` mencatat before/after diff: hanya field yang berubah (via `getChanges()` dan `getOriginal()`) — bukan seluruh record
  - Skip logging jika `auth()->id()` null (proses seeder, artisan command, job tanpa auth) — mencegah error saat seeding
  - `ip_address` diambil dari `request()->ip()` untuk traceability
- **LogImportDataController** hanya read-only (GET index) karena log import ditulis oleh `CsvImportService` (Tahap 5), bukan oleh admin secara manual
- **AuditLogController** hanya read-only (GET index) karena audit log ditulis otomatis oleh observer, bukan oleh user. Dibatasi `role:super_admin` sesuai AGENTS.md bagian 6
- Tahap berikutnya: Fetch prakiraan cuaca BMKG API (Tahap 11)

---


## [Tahap 9] - Endpoint Publik Landing Page - 2026-07-05
### Ditambahkan
- `PublicController` (`app/Http/Controllers/Api/PublicController.php`) — controller terpisah dari controller admin, berisi 4 method GET-only TANPA middleware auth (Golden Rule #7):
  - `cuacaTerkini()`: data dasarian paling baru untuk stasiun default
  - `rekomendasiTerkini()`: hasil rekomendasi paling baru beserta relasi dasarian
  - `ringkasanTerkini()`: ringkasan AI berstatus `published` paling baru (draft TIDAK ditampilkan)
  - `kontenAktif()`: daftar konten landing page yang `is_active = true`, diurutkan `urutan_tampil ASC`
- `CuacaDasarianResource` (`app/Http/Resources/CuacaDasarianResource.php`) — API Resource untuk data cuaca dasarian publik. Menampilkan: periode (tahun/bulan/dasarian_ke/tanggal), curah hujan (total_mm, hari_hujan), status_musim, stasiun (nama, kode_wmo). TIDAK ekspos: id internal, stasiun_id, jumlah_hari_missing, dihitung_pada
- `RekomendasiPublicResource` (`app/Http/Resources/RekomendasiPublicResource.php`) — API Resource untuk rekomendasi publik. Menampilkan: status_rekomendasi, label_rekomendasi (terjemahan awam), tanggal_evaluasi, rule (nama), dasarian (ringkasan). TIDAK ekspos: catatan_teknis, rule_id, dasarian_id, internal IDs. Termasuk method `getLabelRekomendasi()` yang menerjemahkan status teknis ke bahasa petani
- `RingkasanPublicResource` (`app/Http/Resources/RingkasanPublicResource.php`) — API Resource untuk ringkasan AI publik. Menampilkan: ringkasan (teks), published_at, rekomendasi terkait (status, dasarian, rule). TIDAK ekspos: id, hasil_rekomendasi_id, direview_oleh, is_edited_manual, generated_at, status (sudah pasti published)
- `KontenPublicResource` (`app/Http/Resources/KontenPublicResource.php`) — API Resource untuk konten landing page. Menampilkan: judul, isi, tipe. TIDAK ekspos: id, dibuat_oleh, is_active, urutan_tampil, timestamps

### Diubah
- `routes/api.php` — ditambahkan route group `/api/publik` TANPA middleware auth berisi 4 endpoint GET. Import `PublicController` ditambahkan. Komentar header diperbarui (bukan lagi "akan dibuat di tahap berikutnya")

### File Terkait
- `app/Http/Controllers/Api/PublicController.php`
- `app/Http/Resources/CuacaDasarianResource.php`
- `app/Http/Resources/RekomendasiPublicResource.php`
- `app/Http/Resources/RingkasanPublicResource.php`
- `app/Http/Resources/KontenPublicResource.php`
- `routes/api.php` (diubah)

### Catatan
- **Daftar Endpoint Publik (TANPA auth, GET only):**
  | Method | Path | Middleware | Fungsi |
  |--------|------|-----------|--------|
  | GET | `/api/publik/cuaca-terkini` | — (publik) | Data dasarian paling baru (stasiun default) |
  | GET | `/api/publik/rekomendasi-terkini` | — (publik) | Hasil rekomendasi terbaru + dasarian terkait |
  | GET | `/api/publik/ringkasan-terkini` | — (publik) | Ringkasan AI published terbaru |
  | GET | `/api/publik/konten` | — (publik) | Konten landing page aktif (pengumuman/tips) |
- **Desain keputusan:**
  - Semua endpoint publik mengembalikan `data: null` dengan pesan informatif jika belum ada data (bukan error 404), agar frontend tidak crash saat database masih kosong
  - Stasiun default = stasiun pertama di tabel `stasiun_iklim` (saat ini hanya 1 stasiun: Klimatologi Jawa Timur, WMO 96943)
  - `RekomendasiPublicResource` menambahkan field `label_rekomendasi` yang menerjemahkan status teknis ke bahasa awam: `optimal_tanam` → "Waktu yang baik untuk menanam padi", `tunggu` → "Belum waktunya, pantau terus cuaca", `tidak_disarankan` → "Belum disarankan untuk menanam"
  - Endpoint `ringkasanTerkini` HANYA menampilkan ringkasan berstatus `published` — draft tidak bocor ke publik
  - API Resource sengaja TIDAK menyertakan ID internal, FK, dan kolom administratif (dibuat_oleh, direview_oleh, catatan_teknis) agar data publik bersih dan aman
  - File `.gitkeep` di `app/Http/Resources/` bisa dihapus sekarang karena folder sudah berisi file Resource asli
- **Endpoint CRUD konten landing page** untuk admin belum dibuat — baru ada endpoint publik GET-nya saja. CRUD admin direncanakan untuk tahap berikutnya
- Tahap berikutnya: CRUD admin konten landing page + audit log (Tahap 10)

---

## [Tahap 8] - Integrasi AI Gemini untuk Ringkasan - 2026-07-05
### Ditambahkan
- `GeminiService` (`app/Services/GeminiService.php`) — service class untuk integrasi Google Gemini API. Method `generateRingkasan(array $dataDasarian, array $dataRekomendasi): string` menyusun prompt terstruktur, mengirim ke Gemini (model `gemini-2.0-flash`), dan mengembalikan teks ringkasan berbahasa Indonesia. Dilengkapi fallback template jika API gagal (timeout, error, API key kosong) — tidak akan crash. HTTP client memakai Guzzle bawaan Laravel
- `RingkasanAiController` (`app/Http/Controllers/Api/RingkasanAiController.php`) — controller dengan 3 method:
  - `index()`: list ringkasan AI dengan filter status (draft/published), paginasi, eager load relasi
  - `generate()`: terima `hasil_rekomendasi_id`, panggil GeminiService, simpan ke `ringkasan_ai` dengan status **draft** (TIDAK otomatis publish — harus review manual admin)
  - `updateAndPublish()`: admin edit `ringkasan_text` (set `is_edited_manual = true`) dan/atau ubah `status` ke `published` (set `published_at` & `direview_oleh`)
- `GenerateRingkasanRequest` (`app/Http/Requests/Admin/GenerateRingkasanRequest.php`) — validasi `hasil_rekomendasi_id` (required, integer, exists di tabel)
- `UpdateRingkasanRequest` (`app/Http/Requests/Admin/UpdateRingkasanRequest.php`) — validasi `ringkasan_text` (sometimes, string, min:10) dan `status` (sometimes, in:draft,published)

### Diubah
- `routes/api.php` — ditambahkan route group `/api/admin/ringkasan` dengan middleware `['auth:sanctum', 'role:admin']` berisi 3 endpoint baru. Import `RingkasanAiController` ditambahkan
- `config/services.php` — ditambahkan entry `'gemini' => ['api_key' => env('GEMINI_API_KEY')]` agar API key dibaca via `config()` (best practice Laravel, bukan `env()` langsung di service)

### File Terkait
- `app/Services/GeminiService.php`
- `app/Http/Controllers/Api/RingkasanAiController.php`
- `app/Http/Requests/Admin/GenerateRingkasanRequest.php`
- `app/Http/Requests/Admin/UpdateRingkasanRequest.php`
- `routes/api.php` (diubah)
- `config/services.php` (diubah)

### Catatan
- **Daftar Endpoint Baru:**
  | Method | Path | Middleware | Fungsi |
  |--------|------|-----------|--------|
  | GET | `/api/admin/ringkasan` | `auth:sanctum`, `role:admin` | List ringkasan AI (filter: status) |
  | POST | `/api/admin/ringkasan/generate` | `auth:sanctum`, `role:admin` | Generate ringkasan dari Gemini API (status: draft) |
  | PUT | `/api/admin/ringkasan/{id}` | `auth:sanctum`, `role:admin` | Edit teks dan/atau publish ringkasan |
- **Alur kerja ringkasan AI (by design):**
  1. Admin trigger `POST /generate` → Gemini generate teks → simpan sebagai **draft**
  2. Admin review teks di dashboard → boleh edit (`PUT /{id}` dengan `ringkasan_text`)
  3. Admin publish (`PUT /{id}` dengan `status: published`) → `published_at` diset, `direview_oleh` diisi
  4. Ringkasan yang sudah `published` akan ditampilkan di landing page petani (endpoint publik, tahap selanjutnya)
- **Format prompt yang dikirim ke Gemini:**
  - **System instruction:** "Kamu adalah penasihat pertanian padi yang membantu petani di Kec. Karangploso..."
  - **Data curah hujan:** periode dasarian, total CH (mm), jumlah hari hujan, hari data valid, status musim, nama stasiun
  - **Hasil rekomendasi:** nama rule, status (diterjemahkan ke bahasa awam: "optimal_tanam" → "waktu yang baik untuk menanam"), catatan teknis
  - **Instruksi output:** ringkasan 3-5 kalimat, bahasa petani (TANPA istilah teknis seperti "dasarian", "threshold", "agregasi"), nada hangat dan mendukung
  - **Gemini config:** temperature 0.7, maxOutputTokens 500
  - Prompt ini bisa disempurnakan di sesi berikutnya setelah dicoba dengan data nyata
- **Fallback mechanism:** Jika Gemini API gagal (timeout 30 detik, API key kosong, error 4xx/5xx), service TIDAK throw exception. Sebaliknya, log error ke `storage/logs/laravel.log` dan return ringkasan template sederhana berbasis data (tanpa AI). Admin bisa mengedit teks fallback ini sebelum publish
- **Guard duplikasi:** Endpoint generate menolak (409) jika `hasil_rekomendasi_id` sudah punya ringkasan — cegah duplikat
- **Model Gemini yang dipakai:** `gemini-2.0-flash` (ringan, cepat, cukup untuk ringkasan singkat). Base URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Belum diimplementasi:** endpoint publik GET untuk ringkasan published (direncanakan di tahap endpoint publik landing page)
- Tahap berikutnya: endpoint publik landing page atau konten landing page (Tahap 9)

---
## [Tahap 7] - Rule Engine dan Hasil Rekomendasi - 2026-07-05
### Ditambahkan
- `RuleEngineService` (`app/Services/RuleEngineService.php`) — service evaluasi rule terhadap data dasarian. Semua threshold dibaca dari kolom `parameter` JSON di database (Golden Rule #5, TIDAK hardcode). Mendukung pola "dasarian berturut-turut": cek N dasarian consecutive memenuhi threshold curah hujan minimum. Menghasilkan `catatan_teknis` transparan yang menjelaskan detail evaluasi per dasarian
- `RuleRekomendasiController` (`app/Http/Controllers/Api/RuleRekomendasiController.php`) — CRUD rule rekomendasi dengan pembatasan role granular di controller (bukan hanya middleware): admin hanya boleh ubah `parameter` & `is_active`, super_admin boleh CRUD penuh. Plus endpoint evaluasi rule engine dan histori hasil rekomendasi
- `StoreRuleRekomendasiRequest` (`app/Http/Requests/Admin/StoreRuleRekomendasiRequest.php`) — validasi buat rule baru (nama_rule, parameter JSON wajib punya `min_curah_hujan_dasarian` & `min_dasarian_berturut`). `authorize()` hanya izinkan super_admin
- `UpdateRuleRekomendasiRequest` (`app/Http/Requests/Admin/UpdateRuleRekomendasiRequest.php`) — validasi update rule (semua field 'sometimes', parameter nested keys `required_with:parameter`)
- `EvaluasiRuleRequest` (`app/Http/Requests/Admin/EvaluasiRuleRequest.php`) — validasi input evaluasi (dasarian_id wajib ada di database)
- `RuleRekomendasiSeeder` (`database/seeders/RuleRekomendasiSeeder.php`) — seed 1 rule default: "Rule Awal Musim Tanam" dengan parameter `{min_curah_hujan_dasarian: 50, min_dasarian_berturut: 3}`

### Diubah
- `routes/api.php` — ditambahkan 2 route group baru: `/api/admin/rules` (CRUD rule, 5 endpoint) dan `/api/admin/rekomendasi` (evaluasi + histori, 2 endpoint)
- `database/seeders/DatabaseSeeder.php` — ditambahkan `RuleRekomendasiSeeder` di posisi ke-4 (setelah StasiunIklimSeeder)

### File Terkait
- `app/Services/RuleEngineService.php`
- `app/Http/Controllers/Api/RuleRekomendasiController.php`
- `app/Http/Requests/Admin/StoreRuleRekomendasiRequest.php`
- `app/Http/Requests/Admin/UpdateRuleRekomendasiRequest.php`
- `app/Http/Requests/Admin/EvaluasiRuleRequest.php`
- `database/seeders/RuleRekomendasiSeeder.php`
- `routes/api.php` (diubah)
- `database/seeders/DatabaseSeeder.php` (diubah)

### Catatan
- **Daftar Endpoint Baru:**
  | Method | Path | Middleware | Fungsi |
  |--------|------|-----------|--------|
  | GET | `/api/admin/rules` | `auth:sanctum`, `role:admin` | List semua rule (filter: is_active) |
  | GET | `/api/admin/rules/{id}` | `auth:sanctum`, `role:admin` | Detail satu rule |
  | POST | `/api/admin/rules` | `auth:sanctum`, `role:admin` | Buat rule baru (super_admin only, dicek di Form Request authorize) |
  | PUT | `/api/admin/rules/{id}` | `auth:sanctum`, `role:admin` | Update rule (admin: hanya parameter & is_active; super_admin: semua field) |
  | DELETE | `/api/admin/rules/{id}` | `auth:sanctum`, `role:admin` | Hapus rule (super_admin only, dicek di controller. Tolak jika sudah ada hasil rekomendasi) |
  | GET | `/api/admin/rekomendasi` | `auth:sanctum`, `role:admin` | Histori hasil rekomendasi (filter: dasarian_id, rule_id, status_rekomendasi) |
  | POST | `/api/admin/rekomendasi/evaluasi` | `auth:sanctum`, `role:admin` | Trigger evaluasi semua rule aktif terhadap satu dasarian |
- **Logika Rule Default "Rule Awal Musim Tanam":**
  - Parameter: `min_curah_hujan_dasarian = 50mm`, `min_dasarian_berturut = 3`
  - Evaluasi: ambil N dasarian berturut-turut mundur dari dasarian yang dievaluasi
  - Jika SEMUA N dasarian >= threshold → `optimal_tanam`
  - Jika dasarian terbaru memenuhi tapi belum N berturut → `tunggu`
  - Jika dasarian terbaru tidak memenuhi → `tidak_disarankan`
  - Jika data dasarian kurang dari N → `tunggu` (data belum cukup)
- **Pembatasan role (defence in depth):**
  - Route middleware `role:admin` — filter awal (super_admin juga lolos karena superset)
  - `StoreRuleRekomendasiRequest::authorize()` — hanya super_admin boleh buat rule baru
  - `RuleRekomendasiController::update()` — admin hanya boleh ubah `parameter` & `is_active`, field lain ditolak 403
  - `RuleRekomendasiController::destroy()` — hanya super_admin, rule yang sudah punya hasil rekomendasi tidak bisa dihapus (409), nonaktifkan saja
- `RuleEngineService::evaluate()` menggunakan upsert ke `hasil_rekomendasi` — evaluasi ulang dasarian yang sama akan meng-update record lama
- Tahap berikutnya: integrasi Gemini API untuk ringkasan AI (Tahap 8)

---

## [Tahap 6] - Service Agregasi Dasarian - 2026-07-05
### Ditambahkan
- `AggregationService` (`app/Services/AggregationService.php`) — service untuk agregasi data_iklim_harian → data_iklim_dasarian. Method `generateDasarian()` untuk satu dasarian, `generateForRange()` untuk rentang bulan sekaligus. Hanya READ dari raw layer, WRITE ke aggregated layer (Golden Rule #6)
- `AggregationController` (`app/Http/Controllers/Api/AggregationController.php`) — endpoint GET (list data dasarian + filter) dan POST /proses (trigger agregasi)
- `ProsesAgregatRequest` (`app/Http/Requests/Admin/ProsesAgregatRequest.php`) — validasi input agregasi (stasiun_id, tahun, bulan wajib; dasarian_ke opsional)

### Diubah
- `routes/api.php` — ditambahkan route group `/api/admin/agregasi` dengan middleware `['auth:sanctum', 'role:admin']` berisi 2 endpoint baru

### File Terkait
- `app/Services/AggregationService.php`
- `app/Http/Controllers/Api/AggregationController.php`
- `app/Http/Requests/Admin/ProsesAgregatRequest.php`
- `routes/api.php` (diubah)

### Catatan
- **Daftar Endpoint Baru:**
  | Method | Path | Middleware | Fungsi |
  |--------|------|-----------|--------|
  | GET | `/api/admin/agregasi` | `auth:sanctum`, `role:admin` | List data dasarian (filter: stasiun_id, tahun, bulan, dasarian_ke) |
  | POST | `/api/admin/agregasi/proses` | `auth:sanctum`, `role:admin` | Trigger proses agregasi (jika dasarian_ke kosong, proses ketiga dasarian sekaligus) |
- **Threshold status_musim (PERKIRAAN AWAL, bisa disesuaikan tim):**
  - `>= 150mm` → `basah`
  - `50–149mm` → `normal`
  - `< 50mm` → `kering`
  - Threshold ini saat ini di-hardcode di `AggregationService::tentukanStatusMusim()`. Ke depan, sebaiknya dipindah ke tabel konfigurasi database agar bisa diubah tanpa deploy ulang
- Metrik yang dihitung per dasarian: `total_curah_hujan_mm` (SUM dari kode_status='normal'), `jumlah_hari_hujan` (curah_hujan > 0), `jumlah_hari_valid` (kode_status='normal'), `jumlah_hari_missing` (kode_status selain 'normal')
- Periode dasarian: D1 = tgl 1–10, D2 = tgl 11–20, D3 = tgl 21–akhir bulan
- `generateForRange()` disediakan untuk bulk processing data historis (misal 1 tahun), tapi belum diexpose via endpoint — bisa ditambahkan nanti jika diperlukan
- Tahap berikutnya: rule engine rekomendasi tanam (Tahap 7)

---

## [Tahap 5] - CRUD Data Iklim Harian dan Import CSV - 2026-07-05
### Ditambahkan
- `DataIklimHarianController` (`app/Http/Controllers/Api/DataIklimHarianController.php`) — CRUD data iklim harian (index dengan filter tanggal/rentang + paginasi, store input manual, update, destroy) + endpoint import CSV
- `CsvImportService` (`app/Services/CsvImportService.php`) — service class untuk parsing file CSV format BMKG (delimiter `;`, desimal koma, skip header/footer, mapping kode 8888→tidak_terukur, 9999→tidak_ada_data). Upsert ke `data_iklim_harian`, log ke `log_import_data`
- `StoreDataIklimHarianRequest` (`app/Http/Requests/Admin/StoreDataIklimHarianRequest.php`) — validasi input manual (stasiun_id, tanggal, curah_hujan_mm, kode_status) dengan pengecekan unique constraint (stasiun_id, tanggal)
- `UpdateDataIklimHarianRequest` (`app/Http/Requests/Admin/UpdateDataIklimHarianRequest.php`) — validasi update, semua field 'sometimes', unique constraint ignore self
- `ImportCsvRequest` (`app/Http/Requests/Admin/ImportCsvRequest.php`) — validasi file upload CSV (mimes:csv,txt, max 5MB) + stasiun_id

### Diubah
- `routes/api.php` — ditambahkan route group `/api/admin/data-iklim` dengan middleware `['auth:sanctum', 'role:admin']` berisi 5 endpoint baru

### File Terkait
- `app/Http/Controllers/Api/DataIklimHarianController.php`
- `app/Services/CsvImportService.php`
- `app/Http/Requests/Admin/StoreDataIklimHarianRequest.php`
- `app/Http/Requests/Admin/UpdateDataIklimHarianRequest.php`
- `app/Http/Requests/Admin/ImportCsvRequest.php`
- `routes/api.php` (diubah)

### Catatan
- **Daftar Endpoint Baru:**
  | Method | Path | Middleware | Fungsi |
  |--------|------|-----------|--------|
  | GET | `/api/admin/data-iklim` | `auth:sanctum`, `role:admin` | List data iklim harian (filter: stasiun_id, tanggal, tanggal_mulai, tanggal_selesai) |
  | POST | `/api/admin/data-iklim` | `auth:sanctum`, `role:admin` | Input manual satu data harian |
  | PUT | `/api/admin/data-iklim/{id}` | `auth:sanctum`, `role:admin` | Update data harian |
  | DELETE | `/api/admin/data-iklim/{id}` | `auth:sanctum`, `role:admin` | Hapus data harian |
  | POST | `/api/admin/data-iklim/import` | `auth:sanctum`, `role:admin` | Import CSV BMKG |
- **PENTING:** Data historis curah hujan TIDAK diambil dari API BMKG (tidak tersedia). Hanya dari input manual atau import file CSV yang didownload dari dataonline.bmkg.go.id
- `CsvImportService` menggunakan `updateOrCreate` (upsert) berdasarkan unique constraint `(stasiun_id, tanggal)` — data yang sudah ada akan di-update, bukan duplikat
- `sumber_data` otomatis diset: `'manual'` untuk input via store(), `'import_csv'` untuk import CSV
- Model `DataIklimHarian` punya `UPDATED_AT = null` (raw data idealnya tidak diubah), tapi endpoint update tetap disediakan untuk koreksi admin. Field `created_at` tetap menunjuk ke waktu pertama kali data masuk
- Tahap berikutnya: endpoint konten landing page atau agregasi dasarian (Tahap 6)

---

## [Tahap 4] - Autentikasi Admin dan Middleware Role - 2026-07-05
### Ditambahkan
- `AuthController` (`app/Http/Controllers/Api/AuthController.php`) — login (issue Sanctum token + update last_login) dan logout (revoke current token)
- `UserController` (`app/Http/Controllers/Api/UserController.php`) — CRUD user admin (index, store, update, destroy). Destroy default nonaktifkan (is_active=false), tambah ?force=true untuk hapus permanen. Guard: tidak bisa hapus diri sendiri
- `CheckRole` middleware (`app/Http/Middleware/CheckRole.php`) — cek role user, super_admin adalah superset dari admin (bisa akses semua endpoint admin)
- `LoginRequest` (`app/Http/Requests/Auth/LoginRequest.php`) — validasi email & password
- `StoreUserRequest` (`app/Http/Requests/Admin/StoreUserRequest.php`) — validasi buat admin baru (nama_lengkap, email unique, password min 8, role_id exists)
- `UpdateUserRequest` (`app/Http/Requests/Admin/UpdateUserRequest.php`) — validasi update admin (semua field 'sometimes', email unique ignore self)

### Diubah
- `app/Http/Kernel.php` — didaftarkan alias middleware `'role' => CheckRole::class`
- `app/Http/Middleware/Authenticate.php` — `redirectTo()` selalu return null (API-only backend, tidak ada route 'login' untuk redirect)
- `routes/api.php` — ditulis ulang dengan route group auth dan admin/users

### File Terkait
- `app/Http/Controllers/Api/AuthController.php`
- `app/Http/Controllers/Api/UserController.php`
- `app/Http/Middleware/CheckRole.php`
- `app/Http/Requests/Auth/LoginRequest.php`
- `app/Http/Requests/Admin/StoreUserRequest.php`
- `app/Http/Requests/Admin/UpdateUserRequest.php`
- `app/Http/Kernel.php` (diubah)
- `app/Http/Middleware/Authenticate.php` (diubah)
- `routes/api.php` (diubah)

### Catatan
- **Daftar Endpoint Baru:**
  | Method | Path | Middleware | Fungsi |
  |--------|------|-----------|--------|
  | POST | `/api/auth/login` | — (publik) | Login, return Sanctum token + data user |
  | POST | `/api/auth/logout` | `auth:sanctum` | Logout, revoke current token |
  | GET | `/api/admin/users` | `auth:sanctum`, `role:super_admin` | List semua user |
  | POST | `/api/admin/users` | `auth:sanctum`, `role:super_admin` | Buat admin baru |
  | PUT | `/api/admin/users/{user}` | `auth:sanctum`, `role:super_admin` | Update admin |
  | DELETE | `/api/admin/users/{user}` | `auth:sanctum`, `role:super_admin` | Nonaktifkan/hapus admin |
- Semua endpoint sudah dites manual: login berhasil return token, list users berhasil, akses tanpa token return 401
- `Authenticate` middleware diubah agar selalu return null (bukan redirect) karena backend API-only — tanpa perubahan ini, request tanpa header `Accept: application/json` akan crash karena route 'login' tidak ada
- Tahap berikutnya: endpoint CRUD data iklim harian (Tahap 5)

---

## [Tahap 3] - Model, Relasi, dan Seeder - 2026-07-05
### Ditambahkan
- Model `Role` — hasMany User, tanpa timestamps
- Model `StasiunIklim` — hasMany DataIklimHarian, hasMany DataIklimDasarian, tanpa timestamps
- Model `DataIklimHarian` — belongsTo StasiunIklim & User, hanya created_at (UPDATED_AT = null, raw data tidak boleh diubah)
- Model `DataIklimDasarian` — belongsTo StasiunIklim, hasMany HasilRekomendasi, tanpa timestamps
- Model `RuleRekomendasi` — belongsTo User (dibuat_oleh, diubah_oleh), hasMany HasilRekomendasi, cast `parameter` → array (Golden Rule #5), hanya updated_at
- Model `HasilRekomendasi` — belongsTo DataIklimDasarian & RuleRekomendasi, hasOne RingkasanAi, tanpa timestamps
- Model `RingkasanAi` — belongsTo HasilRekomendasi & User (direview_oleh), tanpa timestamps
- Model `KontenLandingPage` — belongsTo User (dibuat_oleh), timestamps standar
- Model `LogImportData` — belongsTo User (triggered_by), tanpa timestamps
- Model `AuditLog` — belongsTo User, cast `detail` → array, hanya created_at (log tidak boleh diubah)
- Model `PrakiraanCuacaBmkg` — standalone (tidak ada FK), tanpa timestamps
- Seeder `RoleSeeder` — insert role `admin` dan `super_admin`
- Seeder `StasiunIklimSeeder` — Stasiun Klimatologi Jawa Timur (WMO 96943, -7.90080, 112.59790, 590m)
- Seeder `AdminSeeder` — 1 akun super_admin awal untuk development

### Diubah
- Model `User` — $fillable diupdate (role_id, nama_lengkap, is_active, last_login), hapus 'name' dan 'remember_token' dari $fillable/$hidden, tambah relasi belongsTo Role, tambah method helper `hasRole()`
- `DatabaseSeeder` — mendaftarkan RoleSeeder → AdminSeeder → StasiunIklimSeeder (urutan dependency)

### File Terkait
- `app/Models/Role.php`
- `app/Models/User.php` (diubah)
- `app/Models/StasiunIklim.php`
- `app/Models/DataIklimHarian.php`
- `app/Models/DataIklimDasarian.php`
- `app/Models/RuleRekomendasi.php`
- `app/Models/HasilRekomendasi.php`
- `app/Models/RingkasanAi.php`
- `app/Models/KontenLandingPage.php`
- `app/Models/LogImportData.php`
- `app/Models/AuditLog.php`
- `app/Models/PrakiraanCuacaBmkg.php`
- `database/seeders/RoleSeeder.php`
- `database/seeders/StasiunIklimSeeder.php`
- `database/seeders/AdminSeeder.php`
- `database/seeders/DatabaseSeeder.php` (diubah)

### Catatan
- **Kredensial dev super_admin:** email `superadmin@myfarmer.test`, password `password123` — JANGAN dipakai di production
- Semua seeder berhasil dijalankan (`php artisan db:seed`)
- Method `hasRole()` ditambahkan di User model sebagai helper untuk pengecekan role di middleware/controller nanti
- `remember_token` dihapus dari $hidden di User karena kolom tersebut sudah di-drop di migration Tahap 2
- Tahap berikutnya: membuat middleware role dan endpoint autentikasi (Tahap 4)

---

## [Tahap 2] - Migration Seluruh Skema Database - 2026-07-05
### Ditambahkan
- Migration `create_roles_table` — tabel roles (admin, super_admin)
- Migration `modify_users_table_add_role_and_profile` — modifikasi users: tambah role_id FK, nama_lengkap, is_active, last_login; hapus name (diganti nama_lengkap) dan remember_token (tidak dipakai di API-only backend)
- Migration `create_stasiun_iklim_table` — metadata stasiun BMKG (kode_wmo unique, koordinat, elevasi)
- Migration `create_data_iklim_harian_table` — raw layer curah hujan harian, enum sumber_data hanya 'manual'/'import_csv' (sesuai AGENTS.md 8a), unique constraint (stasiun_id, tanggal), index pada tanggal
- Migration `create_data_iklim_dasarian_table` — aggregated layer per dasarian, unique constraint (stasiun_id, tahun, bulan, dasarian_ke), index pada (tahun, bulan)
- Migration `create_rule_rekomendasi_table` — definisi rule dengan kolom parameter JSON (Golden Rule #5)
- Migration `create_hasil_rekomendasi_table` — output rule engine per dasarian
- Migration `create_ringkasan_ai_table` — ringkasan Gemini API, index pada status (untuk query landing page)
- Migration `create_konten_landing_page_table` — pengumuman/tips untuk petani
- Migration `create_log_import_data_table` — log proses fetch/import data
- Migration `create_audit_log_table` — jejak aktivitas admin (untuk super_admin)
- Migration `create_prakiraan_cuaca_bmkg_table` — prakiraan cuaca real-time dari API publik BMKG, unique constraint (kode_adm4, datetime_prakiraan), TERPISAH dari data historis

### File Terkait
- `database/migrations/2026_07_05_000001_create_roles_table.php`
- `database/migrations/2026_07_05_000002_modify_users_table_add_role_and_profile.php`
- `database/migrations/2026_07_05_000003_create_stasiun_iklim_table.php`
- `database/migrations/2026_07_05_000004_create_data_iklim_harian_table.php`
- `database/migrations/2026_07_05_000005_create_data_iklim_dasarian_table.php`
- `database/migrations/2026_07_05_000006_create_rule_rekomendasi_table.php`
- `database/migrations/2026_07_05_000007_create_hasil_rekomendasi_table.php`
- `database/migrations/2026_07_05_000008_create_ringkasan_ai_table.php`
- `database/migrations/2026_07_05_000009_create_konten_landing_page_table.php`
- `database/migrations/2026_07_05_000010_create_log_import_data_table.php`
- `database/migrations/2026_07_05_000011_create_audit_log_table.php`
- `database/migrations/2026_07_05_000012_create_prakiraan_cuaca_bmkg_table.php`

### Catatan
- Semua 12 migration berhasil dijalankan tanpa error (`php artisan migrate`)
- Kolom `name` dan `remember_token` dihapus dari tabel users karena diganti oleh `nama_lengkap` dan tidak dipakai (API-only, autentikasi via Sanctum token)
- Foreign key `role_id` pada users menggunakan `onDelete('restrict')` — role tidak bisa dihapus selama masih ada user yang memakainya
- `status_musim` di `data_iklim_dasarian` dibuat nullable karena nilainya baru diisi setelah rule engine berjalan
- `prakiraan_cuaca_bmkg` TIDAK punya FK ke `stasiun_iklim` karena menggunakan kode wilayah `adm4` (bukan kode WMO stasiun)
- Tahap berikutnya: membuat Eloquent Model untuk semua tabel (Tahap 3)

---

## [Tahap 1] - Setup Awal & Konfigurasi - 2026-07-05
### Ditambahkan
- Trait `ApiResponse` di `app/Traits/ApiResponse.php` dengan method `successResponse()` dan `errorResponse()` sesuai format standar AGENTS.md bagian 5
- Folder `app/Services/` (dengan `.gitkeep`) — untuk service class kompleks (agregasi, rule engine, AI, import CSV)
- Folder `app/Http/Resources/` (dengan `.gitkeep`) — untuk API Resource class
- Folder `app/Traits/` — dibuat otomatis saat membuat `ApiResponse.php`
- Variabel `GEMINI_API_KEY` dan `BMKG_API_BASE_URL` ditambahkan ke `.env.example`

### Diubah
- `config/cors.php`: ditambahkan TODO comment untuk restrict `allowed_origins` di production, `supports_credentials` diubah ke `true` (untuk Sanctum token auth), `max_age` diubah ke `86400` (24 jam)

### File Terkait
- `app/Traits/ApiResponse.php`
- `app/Services/.gitkeep`
- `app/Http/Resources/.gitkeep`
- `config/cors.php`
- `.env.example`

### Catatan
- Laravel Sanctum v3.3 sudah terinstal sebagai dependency bawaan Laravel 10.50.2 (ada di `composer.json`), User model sudah menggunakan `HasApiTokens` trait, migration `personal_access_tokens` sudah ada dan sudah dijalankan — tidak perlu install ulang
- CORS diset `allowed_origins => ['*']` untuk development — WAJIB diubah ke domain spesifik saat deploy ke production (lihat TODO di `config/cors.php`)
- `EnsureFrontendRequestsAreStateful` middleware di `Kernel.php` sengaja tetap di-comment karena proyek ini menggunakan token-based auth (bukan SPA/session-based)
- Tahap berikutnya: membuat migration untuk 11 tabel inti sesuai skema di AGENTS.md bagian 4 (Tahap 2)

---

## [Catatan Desain] - Koreksi Sumber Data BMKG - 2026-07-05
### Catatan
- **PENTING:** BMKG tidak menyediakan API untuk data historis curah hujan. Data historis HANYA bisa didapat lewat download manual dari Data Online BMKG (`dataonline.bmkg.go.id`), lalu diimpor ke sistem lewat fitur import CSV. Kolom `sumber_data` di `data_iklim_harian` HANYA berisi `manual` atau `import_csv`, TIDAK ada `api_bmkg`.
- BMKG MEMILIKI API publik untuk **prakiraan cuaca real-time** (`api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode_wilayah}`) via Portal Data Terbuka BMKG. Data ini bersifat forecast (bukan historis), granularitas per 3 jam, key lokasi pakai kode wilayah `adm4` (bukan stasiun WMO). Disimpan di tabel terpisah `prakiraan_cuaca_bmkg`, dipakai khusus untuk widget cuaca real-time di landing page, TIDAK dipakai sebagai input rule engine.
- Kode `adm4` spesifik untuk Kec. Karangploso masih perlu dicari manual oleh tim — lihat TODO di Tahap 12 dokumen prompt bertahap.

---

## [Tahap 0] - Inisialisasi Proyek - 2026-07-05
### Ditambahkan
- Project Laravel v10.50.2 (PHP v8.1.10) dibuat menggunakan `laravel new myfarmer` (dilakukan manual oleh developer, bukan oleh CLAUDE)
- Koneksi database `myfarmer` (MySQL) sudah dikonfigurasi di `.env`
- File `AGENTS.md` ditambahkan sebagai aturan paten proyek
- File `CHANGELOG.md` ini dibuat sebagai log konteks antar sesi CLAUDE

### File Terkait
- `.env`
- `AGENTS.md`
- `CHANGELOG.md`

### Catatan
- Backend akan dikembangkan sebagai REST API murni, terpisah dari frontend
- Skema database mengikuti desain 11 tabel (raw → aggregated → rule engine → AI summary), lihat `AGENTS.md` bagian 4
- Tahap berikutnya: setup Sanctum, CORS, dan struktur folder dasar (Tahap 1)
