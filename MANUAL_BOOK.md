# Manual Book Sistem Informasi MyFarmer

Selamat datang di Buku Panduan (Manual Book) Sistem Informasi MyFarmer. Dokumen ini merangkum seluruh informasi fungsional, arsitektur, dan operasional sistem MyFarmer.

## 1. Tentang MyFarmer

**MyFarmer** adalah sistem informasi curah hujan berbasis kecerdasan buatan (AI) yang dikembangkan untuk membantu optimalisasi waktu tanam padi di Kecamatan Karangploso. Sistem ini menyajikan informasi cuaca, grafik curah hujan, serta rekomendasi awal musim tanam (Awal Musim Hujan / AMH) yang diolah menggunakan metode berbasis aturan (*rule-based*) dan disajikan dalam narasi yang mudah dipahami petani berkat integrasi AI (Groq API).

---

## 2. Arsitektur Sistem

MyFarmer menggunakan pola *client-server* (Monorepo) yang terdiri dari:

- **Frontend (Aplikasi Klien):** Dibangun menggunakan **Next.js (TypeScript)**. Menyediakan Landing Page (untuk publik/petani) dan Panel Admin.
- **Backend (API Server):** Dibangun menggunakan **Laravel 10 (PHP 8.1)**. Menangani logika bisnis, manajemen data curah hujan, agregasi data, mesin aturan (Rule Engine), dan layanan AI.
- **Database:** Menggunakan **MySQL** dengan 14 tabel untuk menyimpan data iklim, konfigurasi *rule*, log audit, dan autentikasi admin.
- **Layanan Eksternal:**
  - **API BMKG (`api.bmkg.go.id`):** Dihubungi secara langsung oleh Frontend untuk mendapatkan prakiraan cuaca real-time.
  - **Data Online BMKG (`dataonline.bmkg.go.id`):** Sumber unduhan file CSV historis curah hujan yang diunggah secara manual ke backend.
  - **Groq API:** Dihubungi oleh Backend (GroqService) untuk mengubah hasil rekomendasi sistem menjadi narasi bahasa Indonesia yang ramah bagi petani.

---

## 3. Hak Akses dan Pengguna

Sistem MyFarmer melayani tiga jenis pengguna:

1. **Petani / Publik:** 
   - **Akses:** Tidak perlu login (tanpa autentikasi).
   - **Tampilan Utama:** Landing Page.
   - **Fungsi:** Melihat rekomendasi tanam, membaca ringkasan AI, melihat grafik curah hujan, cuaca terkini, dan konten/berita edukasi pertanian.
   
2. **Admin:**
   - **Akses:** Memerlukan login dengan email dan password.
   - **Tampilan Utama:** Panel Admin (`/admin/*`).
   - **Fungsi:** Mengelola data iklim harian (termasuk import CSV), menjalankan agregasi dasarian (per 10 hari), mengevaluasi *rule engine*, memicu *generate* ringkasan AI, dan mempublikasikan hasil.
   
3. **Super Admin:**
   - **Akses:** Sama dengan admin, namun memiliki fungsi eksklusif.
   - **Fungsi Ekstra:** Membuat, menghapus, atau menduplikasi *rule* rekomendasi tanam, mengelola akun admin lain, dan melihat Audit Log seluruh aktivitas sistem.

---

## 4. Alur Kerja (Workflow) Sistem

Alur kerja MyFarmer dimulai dari input data cuaca hingga menjadi rekomendasi untuk petani:

1. **Input Data Iklim (Admin):** Admin menginput data iklim harian secara manual atau mengunggah file CSV (dari portal BMKG).
2. **Agregasi Data Dasarian (Admin):** Admin memerintahkan sistem untuk mengolah data harian menjadi data dasarian (periode 10 harian). Sistem menghitung curah hujan total dan hari hujan.
3. **Evaluasi Rule Engine (Admin):** Admin menjalankan "Evaluasi Rule Engine". Sistem memeriksa data dasarian terhadap konfigurasi (misal: curah hujan > 50mm, min 3 hari hujan berturut-turut). Sistem menghasilkan status (`optimal_tanam`, `tunggu`, atau `tidak_disarankan`).
4. **Generate Ringkasan AI (Admin):** Setelah dievaluasi, sistem mengirimkan data tersebut ke Groq API untuk dinarasikan (status: draft).
5. **Review & Publikasi (Admin):** Admin membaca hasil draft AI. Jika sudah sesuai, status diubah menjadi `published`.
6. **Konsumsi Informasi (Petani):** Petani membuka Landing Page dan melihat rekomendasi terbaru yang sudah dinarasikan AI beserta grafiknya.

---

## 5. Logika Rekomendasi (Rule Engine)

Keputusan rekomendasi dibuat murni oleh logika pemrograman, bukan ditebak oleh AI. AI hanya menarasikan hasilnya. 

**Dasar Penentuan Awal Musim Hujan (AMH) MyFarmer:**
- **Dasarian (10 hari):** Data harian diolah menjadi periode 10 hari.
- **Kriteria Curah Hujan (CH):** Batas minimal curah hujan dalam 1 dasarian (default: 50mm).
- **Kriteria Hari Hujan (HH):** Opsional (berdasarkan jurnal Ulfah & Sulistya 2015). Diperlukan minimal 3 hari hujan (CH ≥ 0,5 mm) dalam 1 dasarian.

**Contoh Aturan (Kriteria Utama):**
Status **Optimal Tanam** diberikan apabila selama 3 dasarian berturut-turut, curah hujan mencapai ≥ 50 mm dan (jika aktif) masing-masing dasarian memiliki minimal 3 Hari Hujan. Jika ada yang gagal, maka status menjadi **Tunggu** atau **Tidak Disarankan**.

---

## 6. Fitur - Fitur Panel Admin

Bagi operator/petugas, berikut adalah fungsi utama yang dapat ditemukan di Panel Admin:

- **Kelola Data Iklim:** Menu untuk menambah data hujan harian atau import batch via CSV.
- **Data Dasarian:** Menu untuk memproses agregasi (harian -> dasarian) dan melihat tabel data dasarian.
- **Kelola Rule:** Menu (khusus Super Admin) untuk membuat, mengatur batas mm curah hujan, mengubah hari hujan, atau melakukan duplikasi uji coba.
- **Rekomendasi Tanam:** Mengeksekusi Rule Engine dan melihat histori kelulusan kriteria curah hujan.
- **Ringkasan AI:** Tombol untuk memanggil Groq API, membaca draft, dan menekan *Publish* ke landing page.
- **Konten Landing Page:** Menulis berita, tips cuaca, atau peringatan untuk ditampilkan ke publik.
- **Manajemen Akun & Log:** Menu untuk melihat log import, audit log (jejak langkah pengguna), dan manajemen admin.

---

## 7. Cara Menjalankan Program (Panduan Developer)

Untuk developer atau staf teknis yang akan menjalankan sistem ini, pastikan terinstal PHP 8.1+, Composer, Node.js 20+, dan MySQL.

**Langkah 1: Menjalankan Backend (Laravel)**
1. Masuk ke folder `myfarmer` via Terminal.
2. Install modul: `composer install`
3. Salin env: `cp .env.example .env` (sesuaikan kredensial DB dan token Groq API di dalamnya).
4. Buat kunci aplikasi: `php artisan key:generate`
5. Migrasi dan Seeding DB: `php artisan migrate --seed`
6. Jalankan Server: `php artisan serve` (berjalan di http://localhost:8000)

**Langkah 2: Menjalankan Frontend (Next.js)**
1. Buka terminal baru, masuk ke folder `myfarmer_frontd`.
2. Install package: `npm ci`
3. Salin env: `cp .env.example .env.local`
4. Jalankan aplikasi: `npm run dev` (berjalan di http://localhost:3000)

---
*Dokumen ini merupakan panduan fungsional yang menyintesiskan isi dari berbagai dokumentasi arsitektur, basis aturan (rule base), dan API yang ada di repositori.*
