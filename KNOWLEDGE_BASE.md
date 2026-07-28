# Knowledge Base Proyek MyFarmer

Dokumen ini adalah ringkasan konteks proyek MyFarmer untuk AI atau developer yang melanjutkan pekerjaan pada repository ini. Gunakan dokumen ini sebagai peta awal, kemudian verifikasi detail terhadap kode aktual dan dokumen sumber yang disebutkan pada setiap bagian.

## 1. Aturan Membaca Sumber

Urutan sumber kebenaran yang disarankan:

1. Kode dan konfigurasi aktual.
2. `AGENTS.md` pada aplikasi yang sedang dikerjakan.
3. `API_DOCUMENTATION.md` untuk kontrak REST API.
4. `RULE_BASE.md` untuk metodologi rekomendasi.
5. `CHANGELOG.md` masing-masing aplikasi untuk riwayat keputusan.
6. Dokumen diagram pada root repository.
7. Dokumen ini sebagai ringkasan lintas bagian.

Sebelum mengubah backend, baca:

- `myfarmer/AGENTS.md`
- `myfarmer/CHANGELOG.md`

Sebelum mengubah frontend, baca:

- `myfarmer_frontd/AGENTS.md`
- `myfarmer_frontd/CHANGELOG.md`
- Panduan Next.js yang relevan di `myfarmer_frontd/node_modules/next/dist/docs/`

Jangan menganggap dokumentasi selalu lebih mutakhir daripada kode. Beberapa dokumen masih memiliki tautan atau istilah lama yang dicatat pada bagian "Temuan dan Utang Teknis".

## 2. Identitas Proyek

- Nama sistem: **MyFarmer**
- Jenis proyek: sistem informasi curah hujan untuk membantu optimalisasi waktu tanam padi.
- Wilayah kajian: Kecamatan Karangploso, Kabupaten Malang, Jawa Timur.
- Konteks: proyek Praktik Kerja Lapangan (PKL) pada lingkungan BMKG/Stasiun Klimatologi Jawa Timur.
- Bentuk repository: monorepo yang memuat backend, frontend, dataset, dan dokumentasi.

Tujuan utama sistem adalah mengubah data curah hujan aktual menjadi informasi dasarian, mengevaluasinya dengan rule rekomendasi, dan menyajikan hasilnya kepada petani serta administrator.

## 3. Struktur Repository

| Path | Fungsi |
|---|---|
| `myfarmer/` | Backend REST API Laravel |
| `myfarmer_frontd/` | Frontend Next.js untuk landing page dan panel admin |
| `data_curah_hujan/` | Dataset CSV curah hujan historis |
| `API_DOCUMENTATION.md` | Kontrak 38 endpoint backend |
| `RULE_BASE.md` | Metodologi rule rekomendasi awal musim tanam |
| `diagram_arsitektur_sistem.md` | Penjelasan arsitektur sistem |
| `diagram_data_flow_tiga_layer_data.md` | Aliran data raw, agregasi, dan rekomendasi |
| `diagram_erd.md` | Dokumentasi ERD yang tersedia saat ini |
| `diagram_activity_integrasi_AI.md` | Alur pembuatan dan publikasi ringkasan AI |
| `diagram_usecase.md` | Use case dan pembagian akses aktor |
| `flowchart_rule_engine_onset_tanam.md` | Flowchart evaluasi rule AMH |

`DB_DOCUMENTATION.md` dirujuk oleh beberapa README dan changelog, tetapi file tersebut tidak tersedia pada root repository saat knowledge base ini dibuat.

## 4. Stack Teknologi Aktual

### Backend

- PHP 8.1
- Laravel 10
- MySQL
- Laravel Sanctum untuk autentikasi token
- Guzzle untuk komunikasi HTTP ke layanan AI
- PHPUnit untuk pengujian
- Laravel Pint untuk format kode

### Frontend

- Next.js 16.2.10
- React 19.2.4
- TypeScript 5
- Tailwind CSS 4
- Recharts 3.9.2
- React Context untuk state autentikasi

### Layanan eksternal

- API publik BMKG untuk prakiraan cuaca.
- Groq Chat Completions API untuk membuat ringkasan berbahasa Indonesia.
- Portal Data Online BMKG sebagai sumber unduhan manual CSV historis.

## 5. Arsitektur Tingkat Tinggi

Sistem terdiri atas tiga bagian utama:

1. Frontend publik untuk petani.
2. Panel administrasi untuk admin dan super admin.
3. Backend Laravel sebagai REST API dan lapisan pengelolaan aplikasi.

Alur umum:

```text
Petani/Admin
    |
    v
Frontend Next.js
    |
    | REST JSON + Bearer Token untuk endpoint admin
    v
Backend Laravel
    |
    +--> MySQL
    |
    +--> Groq API

Landing page
    |
    +--> Backend Laravel untuk data aplikasi
    |
    +--> API publik BMKG secara langsung untuk prakiraan cuaca
```

Backend tidak menyediakan atau menyimpan prakiraan cuaca BMKG. Jalur prakiraan backend pernah ada, tetapi sudah dihapus. Prakiraan cuaca hanya diambil langsung oleh frontend melalui `myfarmer_frontd/lib/bmkgClient.ts`.

## 6. Batas Sumber Data

### Data historis curah hujan

BMKG tidak menyediakan API publik untuk data historis curah hujan yang dipakai sistem ini. Data historis hanya masuk melalui:

- input manual admin; atau
- import file CSV yang diunduh dari Data Online BMKG.

Nilai `sumber_data` pada data iklim harian hanya:

- `manual`
- `import_csv`

Jangan membuat proses yang mengisi data historis melalui API prakiraan BMKG.

### Data prakiraan cuaca

Data prakiraan berasal dari:

```text
https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode}
```

Data tersebut:

- dipanggil langsung oleh browser;
- tidak disimpan oleh backend;
- tidak dicampur dengan data iklim harian;
- tidak menjadi input rule engine.

## 7. Alur Data Sistem

Alur implementasi yang tersedia dalam proyek:

```text
CSV/input manual
        |
        v
data_iklim_harian
        |
        | AggregationService
        v
data_iklim_dasarian
        |
        | RuleEngineService
        v
hasil_rekomendasi
        |
        | GroqService
        v
ringkasan_ai (draft)
        |
        | review/publish admin
        v
endpoint publik
        |
        v
landing page
```

Alur ini menjelaskan sistem secara keseluruhan. Jangan otomatis menganggap seluruh tahap tersebut merupakan kontribusi satu anggota PKL.

## 8. Backend Laravel

### 8.1 Karakteristik

- Backend adalah REST API murni.
- Respons untuk konsumen aplikasi seharusnya berupa JSON.
- Tidak ada landing page aplikasi yang dirender menggunakan Blade.
- Base path endpoint adalah `/api`.
- Jumlah route API aktual: **38 route**.

Entry point route:

```text
myfarmer/routes/api.php
```

### 8.2 Modul endpoint

| Modul | Prefix utama | Akses |
|---|---|---|
| Autentikasi | `/api/auth` | Login publik, logout terautentikasi |
| User | `/api/admin/users` | Super admin |
| Stasiun | `/api/admin/stasiun` | Admin dan super admin |
| Data iklim | `/api/admin/data-iklim` | Admin dan super admin |
| Agregasi | `/api/admin/agregasi` | Admin dan super admin |
| Rule | `/api/admin/rules` | Admin dengan pembatasan granular; struktur untuk super admin |
| Rekomendasi | `/api/admin/rekomendasi` | Admin dan super admin |
| Ringkasan AI | `/api/admin/ringkasan` | Admin dan super admin |
| Konten | `/api/admin/konten` | Admin dan super admin |
| Log import | `/api/admin/log-import` | Admin dan super admin |
| Audit log | `/api/admin/audit-log` | Super admin |
| Publik | `/api/publik` | Tanpa autentikasi, hanya GET |

Kontrak lengkap terdapat pada `API_DOCUMENTATION.md`.

### 8.3 Autentikasi dan otorisasi

- Login menggunakan email dan password.
- Backend menerbitkan personal access token Laravel Sanctum.
- Frontend mengirim token melalui header:

```http
Authorization: Bearer {token}
```

- Role yang tersedia:
  - `admin`
  - `super_admin`
- `super_admin` diperlakukan sebagai superset dari `admin`.
- Middleware role berada di `myfarmer/app/Http/Middleware/CheckRole.php`.

Hak akses utama:

| Aktor | Hak akses |
|---|---|
| Publik | Membaca data landing page tanpa login |
| Admin | Mengelola data operasional, menjalankan proses, mengelola konten dan ringkasan |
| Super admin | Seluruh akses admin, pengelolaan user, struktur rule, dan audit log |

### 8.4 Format respons API

Format sukses yang diharapkan:

```json
{
  "status": "success",
  "message": "Operasi berhasil.",
  "data": {}
}
```

Format gagal yang diharapkan:

```json
{
  "status": "error",
  "message": "Terjadi kesalahan.",
  "errors": {}
}
```

Helper respons berada di:

```text
myfarmer/app/Traits/ApiResponse.php
```

Gunakan HTTP status code yang sesuai, antara lain 200, 201, 400, 401, 403, 404, 409, 422, dan 500.

### 8.5 Service utama

| Service | Fungsi |
|---|---|
| `CsvImportService` | Membaca format CSV BMKG dan menyimpan data iklim harian |
| `AggregationService` | Mengagregasi data harian menjadi data dasarian |
| `RuleEngineService` | Mengevaluasi rule aktif terhadap jendela data dasarian |
| `GroqService` | Membuat ringkasan bahasa Indonesia atau menghasilkan fallback |

Service berada di `myfarmer/app/Services/`.

### 8.6 Import CSV

Format CSV BMKG yang ditangani:

- delimiter titik koma (`;`);
- desimal menggunakan koma;
- baris metadata dan footer dilewati;
- hanya baris dengan tanggal `dd/mm/yyyy` yang diproses;
- `8888` berarti tidak terukur;
- `9999` berarti tidak ada data;
- `8888` dan `9999` disimpan sebagai curah hujan `NULL` dengan status yang sesuai.

### 8.7 Agregasi dasarian

Pembagian periode:

- Dasarian 1: tanggal 1–10.
- Dasarian 2: tanggal 11–20.
- Dasarian 3: tanggal 21–akhir bulan.

Metrik hasil agregasi:

- total curah hujan;
- jumlah hari hujan;
- jumlah hari valid;
- jumlah hari missing;
- status musim.

Satu hari dihitung sebagai hari hujan ketika curah hujan aktual minimal `0,5 mm`.

Proses agregasi hanya membaca `data_iklim_harian` dan menulis ke `data_iklim_dasarian`. Proses tersebut tidak boleh menghapus atau menimpa raw data sebagai efek samping.

## 9. Rule Engine Rekomendasi

Rule aktif disimpan pada tabel `rule_rekomendasi`. Seluruh parameter evaluasi harus dibaca dari kolom JSON `parameter`, bukan ditanam langsung di `RuleEngineService`.

Parameter default:

```json
{
  "min_curah_hujan_dasarian": 50,
  "min_dasarian_berturut": 3,
  "total_alternatif_mm": 150,
  "pakai_kriteria_hari_hujan": true,
  "min_hari_hujan_dasarian": 3
}
```

### Kriteria utama

Seluruh `N` dasarian dalam jendela memiliki curah hujan minimal sesuai parameter.

### Kriteria alternatif

- Dasarian pertama mencapai minimum curah hujan.
- Sedikitnya satu dasarian lanjutan berada di bawah minimum.
- Total curah hujan seluruh jendela mencapai batas alternatif.

### Penguatan hari hujan

Jika `pakai_kriteria_hari_hujan` aktif, setiap dasarian harus mencapai minimum jumlah hari hujan.

### Status keluaran

| Status | Makna |
|---|---|
| `optimal_tanam` | Indikator curah hujan dan, jika aktif, hari hujan mendukung awal tanam |
| `tunggu` | Data belum cukup atau kondisi belum terkonfirmasi |
| `tidak_disarankan` | Kondisi terkini belum mendukung |

Rule engine menggunakan data aktual yang sudah terkumpul. Hasilnya adalah rekomendasi atau konfirmasi berbasis indikator hujan, bukan prediksi cuaca masa depan.

## 10. Integrasi AI Aktual

Provider AI aktual adalah **Groq**, bukan Gemini.

Konfigurasi:

```env
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
```

Implementasi berada di:

```text
myfarmer/app/Services/GroqService.php
```

Prinsip penting:

- AI tidak menentukan status rekomendasi.
- Status rekomendasi dihasilkan oleh rule engine.
- AI hanya mengubah data dan catatan teknis menjadi ringkasan yang lebih mudah dipahami.
- Hasil generate disimpan sebagai `draft`.
- Admin harus meninjau dan memublikasikan ringkasan sebelum dapat dibaca publik.
- Jika Groq gagal, backend menghasilkan ringkasan fallback agar alur aplikasi tidak berhenti.

Alur:

```text
hasil rekomendasi deterministik
        |
        v
Groq/fallback
        |
        v
ringkasan draft
        |
        v
review admin
        |
        v
published
```

Dokumen atau judul laporan yang masih menyebut **Gemini AI** harus diselaraskan dengan implementasi Groq, atau menggunakan istilah netral "layanan Artificial Intelligence".

## 11. Frontend Next.js

Frontend memiliki dua area yang dipisahkan:

### Landing page publik

- Route utama: `/`
- Tidak membutuhkan login.
- Mengambil data aplikasi hanya dari endpoint `/api/publik/*`.
- Mengambil prakiraan langsung dari API BMKG melalui `lib/bmkgClient.ts`.
- Menampilkan prakiraan, rekomendasi, ringkasan AI, grafik curah hujan, serta konten.

### Panel admin

- Prefix route: `/admin/*`
- Login: `/admin/login`
- Halaman lain memerlukan token.
- Navigasi disesuaikan dengan role.
- Menu user dan audit log hanya ditampilkan untuk `super_admin`.

### Client dan state penting

| File | Fungsi |
|---|---|
| `lib/apiClient.ts` | Client terpusat untuk backend Laravel |
| `lib/bmkgClient.ts` | Client langsung ke API publik BMKG |
| `lib/auth.ts` | Helper token di browser |
| `context/AuthContext.tsx` | State login dan informasi user |
| `components/admin/AdminShell.tsx` | Proteksi layout dan navigasi admin |

Token dan data user disimpan pada `localStorage` dengan key:

- `myfarmer_token`
- `myfarmer_user`

Backend tetap menjadi lapisan keamanan utama. Menyembunyikan menu berdasarkan role di frontend hanya merupakan lapisan UX.

## 12. Entitas Data Utama

Tabel inti proyek:

| Tabel | Fungsi |
|---|---|
| `roles` | Daftar peran |
| `users` | Akun admin dan super admin |
| `stasiun_iklim` | Metadata stasiun |
| `data_iklim_harian` | Raw data curah hujan |
| `data_iklim_dasarian` | Hasil agregasi 10 harian |
| `rule_rekomendasi` | Rule dan parameter JSON |
| `hasil_rekomendasi` | Hasil evaluasi per rule dan periode |
| `ringkasan_ai` | Ringkasan draft/published |
| `konten_landing_page` | Pengumuman dan tips |
| `log_import_data` | Histori import CSV |
| `audit_log` | Jejak perubahan oleh admin |

Tabel bawaan Laravel yang relevan:

- `personal_access_tokens`
- `password_reset_tokens`
- `failed_jobs`

Perancangan ERD dan struktur database merupakan ruang lingkup tersendiri dalam pembagian laporan PKL. Backend mengimplementasikan akses terhadap rancangan tersebut, tetapi anggota backend tidak boleh mengklaim sebagai perancang database jika memang dikerjakan anggota lain.

## 13. Environment dan Menjalankan Proyek

### Backend

```powershell
cd myfarmer
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Variabel penting:

```env
DB_CONNECTION=mysql
DB_DATABASE=myfarmer
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
```

### Frontend

```powershell
cd myfarmer_frontd
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Variabel penting:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_BMKG_KODE_ADM4=35.07.23.2004
```

## 14. Verifikasi Proyek

Perintah backend:

```powershell
cd myfarmer
php artisan route:list --path=api --except-vendor
php artisan test
```

Perintah frontend:

```powershell
cd myfarmer_frontd
npm run lint
npm run build
```

Status verifikasi pada 25 Juli 2026:

- Route backend: 38 route.
- Test backend: 51 test lulus dengan 146 assertion.
- Lint frontend: 0 error dan 1 warning pada file cadangan `page_backup.tsx`.
- Build produksi frontend: berhasil.
- Route frontend hasil build: 14 route termasuk halaman not-found.

Backend test menggunakan database `myfarmer_testing`, sebagaimana dikonfigurasi pada `myfarmer/phpunit.xml`.

## 15. Aturan Penting Saat Mengubah Kode

### Backend

- Jangan mengubah migration lama yang sudah pernah dijalankan.
- Buat migration baru untuk perubahan skema.
- Gunakan Form Request untuk validasi.
- Gunakan service terpisah untuk logika kompleks.
- Jangan hardcode parameter rule rekomendasi.
- Jangan campurkan prakiraan BMKG dengan data historis.
- Endpoint publik tidak menggunakan autentikasi dan hanya menggunakan GET.
- Pertahankan format respons API.
- Perbarui `myfarmer/CHANGELOG.md` setelah perubahan backend.

### Frontend

- Semua request backend harus melalui `lib/apiClient.ts`.
- Request langsung ke BMKG hanya melalui `lib/bmkgClient.ts`.
- Base URL backend harus berasal dari environment variable.
- Pisahkan area publik dan admin.
- Lindungi route admin dan sesuaikan UI dengan role.
- Tangani loading, data kosong, dan error.
- Perbarui `myfarmer_frontd/CHANGELOG.md` setelah perubahan frontend.

## 16. Temuan dan Utang Teknis

Bagian ini berisi kondisi aktual yang perlu diketahui AI berikutnya. Jangan memperbaikinya tanpa permintaan atau otorisasi pengguna.

### 16.1 Token user nonaktif

Pemeriksaan `is_active` dilakukan saat login. Ketika user dinonaktifkan, implementasi saat ini hanya mengubah `is_active` menjadi `false` dan tidak mencabut token Sanctum yang sudah diterbitkan. Middleware role juga belum memeriksa status aktif pada setiap request.

Risiko: token milik user yang baru dinonaktifkan dapat tetap digunakan sampai token tersebut dicabut atau user melakukan logout.

File terkait:

- `myfarmer/app/Http/Controllers/Api/AuthController.php`
- `myfarmer/app/Http/Controllers/Api/UserController.php`
- `myfarmer/app/Http/Middleware/CheckRole.php`

### 16.2 Format validasi belum sepenuhnya seragam

Hanya `GrafikCurahHujanRequest` yang secara eksplisit mengubah kegagalan validasi menjadi format `{status, message, errors}`. Form Request lain masih dapat menghasilkan format bawaan Laravel tanpa field `status`.

`apiClient.ts` hanya meneruskan error per-field ketika payload memiliki `status: "error"`. Akibatnya, error validasi bawaan Laravel dapat kehilangan detail `errors` di frontend.

File terkait:

- `myfarmer/app/Exceptions/Handler.php`
- `myfarmer/app/Http/Requests/Public/GrafikCurahHujanRequest.php`
- `myfarmer_frontd/lib/apiClient.ts`

### 16.3 Kelengkapan data agregasi

Validasi agregasi hanya memastikan bahwa sedikitnya satu record harian tersedia pada dasarian yang akan diproses. `jumlah_hari_missing` dihitung dari record yang ada tetapi berstatus bukan `normal`; tanggal yang tidak memiliki record sama sekali tidak dihitung.

Risiko: satu record valid dapat ditampilkan sebagai `1/1 hari`, padahal periode dasarian seharusnya memiliki 10 atau 8–11 hari tergantung periode.

File terkait:

- `myfarmer/app/Http/Requests/Admin/ProsesAgregatRequest.php`
- `myfarmer/app/Services/AggregationService.php`

### 16.4 CORS development

`myfarmer/config/cors.php` masih mengizinkan semua origin dan memiliki TODO untuk membatasi origin pada production.

### 16.5 Dokumen yang hilang atau tertinggal

- `DB_DOCUMENTATION.md` tidak tersedia meskipun dirujuk oleh README.
- `diagram_arsitektur_sistem.md` masih merujuk beberapa nama file lama.
- Dokumen arsitektur menyebut jumlah controller yang tidak selalu sama dengan kode aktual.

### 16.6 File cadangan frontend

File berikut masih berada di source tree:

- `myfarmer_frontd/app/(public)/page_backup.tsx`
- `myfarmer_frontd/app/(public)/layout_backup.tsx`

`page_backup.tsx` menghasilkan satu warning lint terkait elemen `<img>`.

### 16.7 Kode wilayah BMKG

Fallback di halaman publik masih menggunakan `35.07.20.2001`, sedangkan `.env.example` menggunakan `35.07.23.2004`. Pastikan kode ADM4 yang benar ditentukan melalui environment deployment, bukan mengandalkan fallback.

## 17. Konteks Pembagian Laporan PKL

Pembagian judul laporan tim:

| Anggota | Judul/fokus |
|---|---|
| 1 | Analisis dan Perancangan Sistem Informasi Data Iklim untuk Optimalisasi Tanam di BMKG Malang |
| 2 | Perancangan Database pada Sistem Informasi Data Iklim untuk Optimalisasi Tanam di BMKG Malang |
| 3 | Implementasi Backend pada Sistem Informasi Data Iklim Menggunakan Framework Laravel |
| 4 | Integrasi layanan AI untuk rekomendasi waktu tanam berdasarkan data iklim BMKG Malang |
| 5 | Pengembangan Antarmuka Pengguna dan Dashboard Monitoring Data Iklim pada Sistem Informasi Optimalisasi Tanam |

Pengguna repository yang meminta knowledge base ini adalah **Anggota 3** dengan peran Backend Developer.

### 17.1 Ruang lingkup laporan Anggota 3

Fokus yang sesuai:

- implementasi REST API menggunakan PHP dan Laravel;
- implementasi route dan controller;
- autentikasi token Laravel Sanctum;
- otorisasi `admin` dan `super_admin`;
- validasi request menggunakan Form Request;
- implementasi endpoint CRUD yang memang dikerjakan;
- filter, pagination, dan pengambilan detail data;
- standardisasi respons JSON;
- penyediaan endpoint untuk frontend dan modul lain;
- audit aktivitas jika memang menjadi kontribusi Anggota 3;
- pengujian endpoint, autentikasi, otorisasi, validasi, dan CRUD.

### 17.2 Batas kontribusi Anggota 3

Jangan mengklaim bagian berikut sebagai kontribusi Anggota 3 jika dikerjakan anggota lain:

- analisis dan perancangan sistem;
- perancangan ERD atau skema database;
- alur data masuk dan import CSV;
- algoritma agregasi data iklim;
- rule engine rekomendasi;
- pemilihan provider AI;
- penyusunan prompt dan integrasi AI;
- antarmuka pengguna dan dashboard.

Bagian tersebut boleh dijelaskan sebagai konteks atau modul yang berinteraksi dengan backend.

Contoh narasi yang aman:

> Backend menyediakan endpoint REST API sebagai penghubung antara frontend, basis data, dan modul pengolahan lainnya. Perancangan basis data, pemrosesan data iklim, dan integrasi layanan AI merupakan bagian terpisah dalam pembagian kerja tim.

### 17.3 Judul yang disarankan untuk Anggota 3

Judul pembagian tim dapat dipertahankan:

> Implementasi Backend pada Sistem Informasi Data Iklim Menggunakan Framework Laravel

Alternatif yang lebih terfokus:

> Implementasi REST API dan Kontrol Akses Berbasis Laravel pada Sistem Informasi Data Iklim untuk Optimalisasi Tanam

Jika istilah Artificial Intelligence tetap muncul pada judul atau latar belakang, posisikan AI sebagai konteks sistem, bukan sebagai kontribusi implementasi Anggota 3.

## 18. Referensi Utama

- `README.md`
- `CONTRIBUTING.md`
- `API_DOCUMENTATION.md`
- `RULE_BASE.md`
- `myfarmer/AGENTS.md`
- `myfarmer/CHANGELOG.md`
- `myfarmer/routes/api.php`
- `myfarmer/app/Services/`
- `myfarmer/tests/`
- `myfarmer_frontd/AGENTS.md`
- `myfarmer_frontd/CHANGELOG.md`
- `myfarmer_frontd/lib/apiClient.ts`
- `myfarmer_frontd/lib/bmkgClient.ts`
- `diagram_arsitektur_sistem.md`
- `diagram_data_flow_tiga_layer_data.md`
- `diagram_erd.md`
- `diagram_activity_integrasi_AI.md`
- `diagram_usecase.md`
- `flowchart_rule_engine_onset_tanam.md`

## 19. Ringkasan Singkat untuk AI

MyFarmer adalah monorepo Laravel dan Next.js untuk menyajikan informasi curah hujan dan rekomendasi awal musim tanam. Data historis berasal dari input manual atau CSV, bukan API BMKG. Backend memiliki 38 route dengan Sanctum dan role admin/super admin. Rule engine menentukan status rekomendasi dari parameter database; Groq hanya menyusun ringkasan dan tidak menentukan keputusan. Frontend publik mengambil prakiraan langsung dari BMKG, sedangkan panel admin menggunakan REST API Laravel.

Dalam konteks laporan PKL, pengguna adalah anggota backend. Bantuan penulisan harus berfokus pada REST API, route/controller, autentikasi, otorisasi, validasi, standardisasi respons, endpoint CRUD, dan pengujian API. Jangan mengatribusikan perancangan database, pemrosesan data, rule engine, integrasi AI, atau frontend kepada pengguna jika bagian tersebut dikerjakan anggota lain.
