# AGENTS.md — MyFarmer Backend

Dokumen ini adalah **aturan paten** proyek MyFarmer yang WAJIB dipatuhi oleh  CLAUDE di setiap sesi pengerjaan. Baca file ini secara penuh sebelum mengerjakan prompt apapun, dan baca `CHANGELOG.md` untuk mengetahui progres/konteks pekerjaan sebelumnya.

---

## 1. Gambaran Proyek

- **Nama Proyek:** MyFarmer
- **Deskripsi:** Sistem Informasi Curah Hujan Berbasis Artificial Intelligence untuk Optimalisasi Tanam Padi di Wilayah Kec. Karangploso (proyek PKL BMKG Jawa Timur)
- **Bagian yang dikerjakan di sini:** Backend saja (REST API)
- **Stack:** Laravel v10.50.2, PHP v8.1.10, MySQL (nama database: `myfarmer`)
- **Autentikasi API:** Laravel Sanctum (token-based, bukan session/cookie)
- **AI yang digunakan sistem:** Groq API (model `openai/gpt-oss-120b`) untuk ringkasan kondisi iklim
- **Arsitektur:** Backend dan frontend adalah **project terpisah**. Backend ini murni REST API — tidak boleh mengembalikan view/Blade, semua response berupa JSON.

---

## 2. Golden Rules (WAJIB, tanpa kecuali)

1. Backend **hanya API**. Tidak ada route yang me-render Blade view untuk konsumen akhir. Semua endpoint mengembalikan JSON.
2. **Jangan pernah mengedit file migration yang sudah pernah dijalankan (`php artisan migrate`).** Kalau ada perubahan skema, buat migration baru (`php artisan make:migration`).
3. **Setiap selesai mengerjakan satu prompt/tahap, WAJIB menambahkan entry baru di `CHANGELOG.md`** sebelum mengakhiri sesi. Format entry dijelaskan di bagian 7.
4. **Nama tabel dan kolom database memakai Bahasa Indonesia, snake_case** — jangan diterjemahkan ke Bahasa Inggris (`data_iklim_harian`, bukan `daily_climate_data`). Ini mengikuti skema yang sudah difinalkan (lihat bagian 4).
5. **Parameter rule rekomendasi HARUS dibaca dari database** (kolom `parameter` bertipe JSON di tabel `rule_rekomendasi`), **jangan pernah hardcode angka threshold** di controller/service manapun.
6. **Data mentah (`data_iklim_harian`) tidak boleh dihapus atau ditimpa oleh proses agregasi.** Proses agregasi hanya membaca (`READ`) dari raw layer dan menulis (`WRITE`) ke `data_iklim_dasarian`.
7. **Endpoint publik (untuk landing page petani) tidak memakai autentikasi sama sekali dan hanya method `GET`.** Endpoint admin/super admin wajib pakai middleware `auth:sanctum` + pengecekan role.
8. **Validasi input selalu memakai Form Request class** (`php artisan make:request`) — jangan validasi inline di dalam controller.
9. **Semua response API mengikuti format standar** (lihat bagian 5). Tidak boleh ada endpoint yang membalas format berbeda tanpa alasan yang dicatat di CHANGELOG.md.
10. **Jangan menginstal package baru di luar yang sudah ditentukan** (lihat bagian 3) tanpa menuliskan alasannya di CHANGELOG.md sebagai entry terpisah.
11. Setiap service kompleks (agregasi, rule engine, integrasi AI, import CSV) **dipisah ke dalam class Service tersendiri** di `app/Services/`, tidak ditulis langsung di controller.
12. Kode, nama variabel, dan komentar teknis boleh campuran Indonesia-Inggris mengikuti konvensi Laravel (contoh: nama fungsi tetap `camelCase` Bahasa Inggris seperti biasa, tapi nama kolom/tabel database tetap Bahasa Indonesia).

---

## 3. Package yang Diizinkan

- `laravel/sanctum` — autentikasi token API
- `guzzlehttp/guzzle` — HTTP client untuk Groq API (biasanya sudah bundled di Laravel)
- Package testing bawaan Laravel (PHPUnit)

Jangan menambah package lain (misal library JWT pihak ketiga, library CSV eksternal) kecuali disebutkan eksplisit di prompt atau dicatat alasannya di CHANGELOG.md.

---

## 4. Referensi Skema Database

Database `myfarmer` sudah didesain dengan 11 tabel inti (lihat detail lengkap di `../DB_DOCUMENTATION.md` pada root monorepo). Ringkasan:

| Tabel | Fungsi |
|---|---|
| `roles` | Daftar role: `admin`, `super_admin` |
| `users` | Akun admin & super admin (petani TIDAK punya akun/login) |
| `stasiun_iklim` | Metadata stasiun BMKG (kode WMO, lintang, bujur, dst) |
| `data_iklim_harian` | **Raw layer** — data curah hujan harian apa adanya, sumber HANYA dari input manual admin atau import file CSV (BMKG tidak menyediakan API untuk data historis curah hujan — hanya download manual lewat Data Online BMKG) |
| `data_iklim_dasarian` | **Aggregated layer** — hasil agregasi per 10 hari |
| `rule_rekomendasi` | Definisi rule beserta parameter (kolom JSON) |
| `hasil_rekomendasi` | Output rule engine per periode dasarian |
| `ringkasan_ai` | Hasil ringkasan dari Groq API |
| `konten_landing_page` | Pengumuman/tips untuk petani, dikelola admin |
| `log_import_data` | Log setiap proses import data CSV BMKG |
| `audit_log` | Jejak aktivitas admin (untuk super admin) |

Alur data: `data_iklim_harian` → (agregasi) → `data_iklim_dasarian` → (rule engine) → `hasil_rekomendasi` → (Groq) → `ringkasan_ai` → ditampilkan di landing page.

---

## 5. Format Response API Standar

**Sukses:**
```json
{
  "status": "success",
  "message": "Data berhasil diambil",
  "data": { }
}
```

**Gagal (validasi/error):**
```json
{
  "status": "error",
  "message": "Terjadi kesalahan validasi",
  "errors": { }
}
```

Gunakan HTTP status code yang sesuai (200, 201, 400, 401, 403, 404, 422, 500). Sebaiknya buat helper/trait `ApiResponse` di `app/Traits/` supaya konsisten dan tidak ditulis ulang di setiap controller.

---

## 6. Aturan Role & Endpoint

| Role | Akses |
|---|---|
| **Publik (tanpa login)** | GET saja: cuaca terkini, rekomendasi terkini, ringkasan AI (published), konten landing page aktif |
| **admin** | CRUD data iklim, trigger agregasi & rule engine, generate/edit ringkasan AI, kelola konten landing page, ubah parameter rule (bukan struktur) |
| **super_admin** | Semua akses admin + kelola akun admin, ubah struktur rule (tambah rule baru), lihat audit log, konfigurasi sistem |

Middleware role harus di-attach di `routes/api.php` per grup route, contoh pola: `Route::middleware(['auth:sanctum', 'role:super_admin'])->group(...)`.

---

## 7. Aturan CHANGELOG.md

CLAUDE **WAJIB** melakukan ini di setiap sesi:
1. **Sebelum mulai kerja:** baca seluruh isi `CHANGELOG.md` untuk memahami apa yang sudah dikerjakan di sesi-sesi sebelumnya.
2. **Setelah selesai kerja:** tambahkan entry baru di bagian paling atas (di bawah `## [Unreleased]`) dengan format:

```markdown
## [Tahap X] - Nama Tahap - YYYY-MM-DD
### Ditambahkan
- Deskripsi file/fitur baru yang dibuat

### Diubah
- Deskripsi perubahan pada file yang sudah ada

### File Terkait
- path/to/file1.php
- path/to/file2.php

### Catatan
- Hal penting yang perlu diketahui di sesi berikutnya (misal: keputusan desain, TODO, dependency baru)
```

Jangan menghapus entry lama. CHANGELOG.md adalah sumber kebenaran konteks proyek antar sesi CLAUDE.

---

## 8a. Aturan Sumber Data — Penting

**BMKG tidak menyediakan API untuk data historis curah hujan.** Data historis hanya bisa didapat lewat download manual dari Data Online BMKG (`dataonline.bmkg.go.id`), lalu diimpor ke sistem lewat fitur import CSV. Oleh karena itu:

- Kolom `sumber_data` di tabel `data_iklim_harian` HANYA boleh bernilai `manual` (input langsung oleh admin) atau `import_csv` (upload file). Jangan membuat service/job yang mencoba fetch data historis dari API BMKG karena API tersebut tidak ada.
- Data **prakiraan cuaca real-time** untuk widget landing page diambil langsung oleh frontend dari API publik BMKG. Backend tidak menyediakan route, service, model, konfigurasi, atau tabel untuk prakiraan tersebut. Data prakiraan tetap TIDAK boleh dicampur ke `data_iklim_harian` dan TIDAK dipakai sebagai input rule engine karena rule engine membutuhkan data historis aktual.

## 8. Aturan Khusus Import CSV Data BMKG

File CSV sumber BMKG memiliki format non-standar berikut, WAJIB ditangani saat parsing:

- Delimiter memakai **titik koma** (`;`), bukan koma
- Angka desimal memakai **koma** (`10,8`), harus dikonversi ke titik (`10.8`) sebelum disimpan
- Ada baris header metadata (ID WMO, NAMA STASIUN, dst) dan footer keterangan yang harus di-skip, hanya baris dengan format tanggal `dd/mm/yyyy` yang diproses
- Kode `8888` = data tidak terukur, kode `9999` = tidak ada data — keduanya disimpan sebagai `curah_hujan_mm = NULL` dengan `kode_status` sesuai, **bukan** disimpan sebagai angka 8888/9999 mentah

---

## 9. Definition of Done per Tahap

Sebuah tahap dianggap selesai jika:
- Kode berjalan tanpa error (`php artisan serve` tidak crash, migration berhasil, endpoint bisa dites via Postman/curl)
- Mengikuti seluruh Golden Rules di atas
- Entry CHANGELOG.md sudah ditambahkan
- Tidak ada TODO kritis yang belum disebutkan di catatan CHANGELOG
