<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — MyFarmer Frontend (myfarmer_frontd)

Dokumen ini adalah **aturan paten** proyek frontend MyFarmer yang WAJIB dipatuhi oleh GPT Codex di setiap sesi pengerjaan. Baca file ini secara penuh, baca `../API_DOCUMENTATION.md` pada root monorepo untuk memahami seluruh endpoint backend, dan baca `CHANGELOG.md` untuk mengetahui progres sesi sebelumnya — sebelum mengerjakan prompt apapun.

---

## 1. Gambaran Proyek

- **Nama Proyek:** MyFarmer Frontend (`myfarmer_frontd`)
- **Bagian yang dikerjakan di sini:** Frontend saja. Backend (Laravel API) berada di folder `../myfarmer` — lihat `../API_DOCUMENTATION.md` untuk kontrak API-nya.
- **Stack:** Next.js (project default sudah dibuat developer). Jika Tailwind CSS belum terpasang, install dan konfigurasikan di tahap awal.
- **Gaya Desain:** **Flat minimalis** — lihat Design System di bagian 5.
- **Struktur Akses:** Dua area dengan tampilan dan tujuan berbeda dalam satu project Next.js:
  - **Landing page publik** (`/`) — dilihat petani, **tanpa login**
  - **Panel admin** (`/admin/*`) — untuk admin & super_admin, **wajib login**
- **Autentikasi:** Token-based (Laravel Sanctum di backend). Frontend menyimpan token dan mengirim lewat header `Authorization: Bearer {token}` di setiap request ke endpoint admin.

---

## 2. Golden Rules (WAJIB, tanpa kecuali)

1. **Landing page publik dan panel admin harus terasa seperti dua "dunia" yang terpisah** — layout, navigasi, dan struktur folder berbeda total. Jangan campur komponen navigasi publik dengan navigasi admin.
2. **Landing page publik TIDAK PERNAH memanggil endpoint yang butuh token.** Hanya boleh memanggil endpoint `/api/publik/*` dari `../API_DOCUMENTATION.md`.
3. **Semua request ke backend HARUS lewat satu API client terpusat** (`lib/apiClient` atau sejenis) yang dibuat di Tahap 1 — jangan panggil `fetch()` langsung tersebar di berbagai komponen.
4. **Base URL backend WAJIB dari environment variable** (`NEXT_PUBLIC_API_BASE_URL`), jangan hardcode `http://localhost:8000` di kode manapun.
5. **Route di dalam `/admin/*` WAJIB dilindungi** — kalau user belum login (tidak ada token valid), redirect ke halaman login admin. Jangan biarkan ada halaman admin yang bisa diakses tanpa autentikasi.
6. **UI harus menyesuaikan role user yang sedang login** — elemen yang hanya boleh diakses `super_admin` (kelola user, ubah struktur rule, audit log) HARUS disembunyikan/dinonaktifkan di UI untuk role `admin`, meskipun validasi utama tetap di backend. Ini untuk mencegah kebingungan (bukan satu-satunya lapisan keamanan).
7. **Setiap selesai mengerjakan satu prompt/tahap, WAJIB menambahkan entry baru di `CHANGELOG.md`** sebelum mengakhiri sesi, dengan format yang dijelaskan di bagian 8.
8. **Jangan menerjemahkan istilah teknis dari backend ke user awam tanpa mapping yang jelas.** Contoh: status backend `optimal_tanam` harus ditampilkan sebagai label ramah petani seperti "Waktu yang baik untuk menanam padi" (backend sudah kirim `label_rekomendasi` siap pakai di beberapa endpoint publik — pakai itu, jangan bikin mapping baru yang beda).
9. **Ikuti kontrak response API apa adanya** dari `../API_DOCUMENTATION.md` — jangan berasumsi field tambahan yang tidak didokumentasikan. Kalau ragu soal struktur response, cek ulang dokumen tersebut.
10. **Tangani state kosong/loading/error secara eksplisit di SETIAP halaman/komponen yang fetch data** — jangan biarkan halaman blank atau crash kalau data belum ada (contoh: endpoint publik punya response `"data": null` untuk kondisi belum ada data — ini harus ditangani dengan pesan yang sesuai, bukan error).
11. **Jangan install state management library berat** (Redux, dsb) kecuali disebutkan eksplisit di prompt. Gunakan React Context API atau state lokal dulu untuk skala proyek ini.
12. **Komponen dipisah per fungsi** di `components/public/` dan `components/admin/` — jangan taruh semua komponen di satu folder datar.

---

## 3. Struktur Folder yang Diharapkan

```
myfarmer_frontd/
├── app/
│   ├── (public)/              # route group landing page
│   │   ├── page.tsx           # halaman utama publik
│   │   └── layout.tsx         # layout khusus publik
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── layout.tsx         # layout khusus admin (sidebar, dst)
│   │   ├── dashboard/
│   │   ├── data-iklim/
│   │   ├── agregasi/
│   │   ├── rules/
│   │   ├── rekomendasi/
│   │   ├── ringkasan-ai/
│   │   ├── konten/
│   │   ├── prakiraan-cuaca/
│   │   ├── users/              # khusus super_admin
│   │   └── audit-log/          # khusus super_admin
│   └── layout.tsx              # root layout
├── components/
│   ├── public/
│   └── admin/
├── lib/
│   ├── apiClient.ts             # HTTP client terpusat
│   ├── auth.ts                  # helper token & role
│   └── constants.ts
├── context/
│   └── AuthContext.tsx
├── AGENTS.md
└── CHANGELOG.md
```

Dokumentasi kontrak API bersama berada di `../API_DOCUMENTATION.md` pada root monorepo.

Sesuaikan detail penamaan file dengan konvensi Next.js App Router yang berlaku di versi project ini.

---

## 4. Autentikasi & Manajemen Token

- Setelah login sukses lewat `POST /api/auth/login`, simpan `token` dan data `user` (termasuk `nama_role`) — gunakan `localStorage` untuk kesederhanaan (skala proyek PKL), dibungkus lewat `AuthContext`.
- Setiap request ke endpoint `/api/admin/*` WAJIB menyertakan header `Authorization: Bearer {token}` lewat API client terpusat.
- Buat mekanisme proteksi route admin (lewat layout check di `app/admin/layout.tsx` atau middleware Next.js) — jika token tidak ada/invalid, redirect ke `/admin/login`.
- Saat logout, panggil `POST /api/auth/logout`, lalu hapus token dari `localStorage` dan redirect ke halaman login.
- Simpan `nama_role` di context supaya komponen bisa melakukan conditional rendering (lihat Golden Rule #6).

---

## 5. Design System — Flat Minimalis

Gunakan prinsip berikut secara konsisten di seluruh aplikasi:

- **Tanpa shadow berlebihan, tanpa gradient** — flat color blocks, border tipis (1px) untuk pemisah, radius sudut kecil-sedang (4–8px) konsisten.
- **Palet warna:** dasar netral (putih/abu sangat muda untuk background), satu warna aksen utama bertema alam/pertanian (contoh: hijau untuk elemen positif/rekomendasi baik, kuning/oranye untuk peringatan/tunggu, merah muted untuk tidak disarankan — dipakai konsisten sesuai `status_rekomendasi`).
- **Tipografi:** satu font sans-serif untuk seluruh aplikasi (gunakan font default Next.js/system font atau satu Google Font saja), hierarki jelas lewat ukuran & bobot (bold untuk judul, regular untuk body), hindari lebih dari 3 ukuran heading.
- **Spacing konsisten** — gunakan skala spacing yang seragam (misal kelipatan 4px/8px) lewat utility class Tailwind, jangan nilai acak.
- **Landing page publik:** harus terasa ramah dan mudah dibaca petani — ukuran teks tidak terlalu kecil, ikon sederhana untuk kondisi cuaca, hindari jargon teknis di teks yang terlihat publik.
- **Panel admin:** lebih padat informasi (tabel, form), tapi tetap flat — gunakan sidebar navigasi sederhana, bukan mega-menu.
- Detail token warna/spacing spesifik ditentukan di Tahap 1 saat setup Tailwind config, dan WAJIB dicatat di CHANGELOG.md supaya konsisten dipakai di tahap-tahap berikutnya.

---

## 6. Referensi Kontrak API

**Jangan menebak struktur endpoint.** Semua kontrak (method, path, request body, response, middleware yang dibutuhkan) didokumentasikan lengkap di `../API_DOCUMENTATION.md`. Baca bagian yang relevan sebelum membuat halaman/komponen yang memanggil endpoint tersebut.

Ringkasan pembagian akses (detail lengkap ada di `../API_DOCUMENTATION.md`):

| Area Frontend | Endpoint yang dipanggil | Butuh Token? |
|---|---|---|
| Landing page publik | `/api/publik/*` (5 endpoint) | Tidak |
| Login admin | `/api/auth/login`, `/api/auth/logout` | Login: tidak, Logout: ya |
| Panel admin (umum) | `/api/admin/data-iklim/*`, `/api/admin/agregasi/*`, `/api/admin/rekomendasi/*`, `/api/admin/ringkasan/*`, `/api/admin/konten/*`, `/api/admin/log-import`, `/api/admin/prakiraan-cuaca/fetch` | Ya (role admin/super_admin) |
| Panel admin (khusus super_admin) | `/api/admin/users/*`, `/api/admin/audit-log`, sebagian `/api/admin/rules/*` (create/delete) | Ya (role super_admin) |

---

## 7. Penanganan Error & Loading State

- Response error dari backend selalu berbentuk `{ "status": "error", "message": "...", "errors": {...} }` — tampilkan `message` ke user dengan komponen alert/toast yang konsisten di seluruh aplikasi, jangan `alert()` bawaan browser.
- Untuk endpoint publik dengan `"data": null` (kondisi belum ada data), tampilkan pesan ramah sesuai `message` dari response, bukan halaman kosong atau error.
- Untuk form admin (create/update), tampilkan error validasi per-field jika response memiliki object `errors`.
- Selalu tampilkan indikator loading (skeleton/spinner sederhana, flat style) saat fetch data, terutama di halaman admin dengan tabel data.

---

## 8. Aturan CHANGELOG.md

Codex **WAJIB** melakukan ini di setiap sesi:
1. **Sebelum mulai kerja:** baca seluruh isi `CHANGELOG.md` untuk memahami progres sesi-sesi sebelumnya, termasuk keputusan desain (warna, komponen apa yang sudah dibuat, dst).
2. **Setelah selesai kerja:** tambahkan entry baru dengan format:

```markdown
## [Tahap X] - Nama Tahap - YYYY-MM-DD
### Ditambahkan
- Deskripsi halaman/komponen baru yang dibuat

### Diubah
- Deskripsi perubahan pada file yang sudah ada

### File Terkait
- path/to/file1.tsx
- path/to/file2.tsx

### Catatan
- Keputusan desain penting (contoh: kode warna hex yang dipakai, nama komponen reusable yang tersedia untuk dipakai di tahap berikutnya)
```

Jangan menghapus entry lama. CHANGELOG.md adalah sumber kebenaran konteks proyek antar sesi Codex — termasuk untuk konsistensi desain visual antar halaman yang dikerjakan di sesi berbeda.

---

## 9. Definition of Done per Tahap

Sebuah tahap dianggap selesai jika:
- Halaman/komponen bisa dijalankan tanpa error (`npm run dev` tidak crash)
- Sudah terhubung ke endpoint backend yang sesuai dari `../API_DOCUMENTATION.md` (bukan data dummy statis, kecuali disebutkan eksplisit di prompt)
- Mengikuti seluruh Golden Rules dan Design System di atas
- Loading state & error state sudah ditangani
- Entry CHANGELOG.md sudah ditambahkan

---

## 10. Catatan Arsitektur

- Struktur "alamat berbeda" antara landing page dan admin diimplementasikan sebagai **path berbeda dalam satu Next.js app** (`/` vs `/admin/*`), bukan subdomain terpisah — ini keputusan untuk kesederhanaan development & deployment di skala proyek PKL. Kalau nanti dibutuhkan subdomain terpisah (misal `admin.myfarmer.id`), itu adalah keputusan infrastruktur saat deployment, bukan perubahan struktur kode di project ini.
