# CHANGELOG â€” MyFarmer Frontend (myfarmer_frontd)

Semua perubahan penting pada frontend proyek MyFarmer dicatat di file ini.
GPT Codex WAJIB membaca file ini di awal setiap sesi dan menambahkan entry baru di setiap akhir sesi (lihat aturan di `AGENTS.md` bagian 8).

Format tanggal: YYYY-MM-DD.

---

## [Unreleased]

## [Tahap 22] - Pembersihan UI Prakiraan Cuaca Backend - 2026-07-16
### Ditambahkan
- Tidak ada fitur baru.

### Diubah
- `AGENTS.md` diselaraskan dengan arsitektur aktual: empat endpoint publik backend untuk data aplikasi dan `lib/bmkgClient.ts` sebagai satu-satunya client langsung ke API publik BMKG.
- Struktur folder dan daftar endpoint panel admin diperbarui agar tidak lagi mencantumkan pengelolaan prakiraan backend.

### Dihapus
- Route/page yatim `/admin/prakiraan-cuaca` yang masih memanggil endpoint backend yang telah dihapus.

### File Terkait
- `app/admin/prakiraan-cuaca/page.tsx`
- `AGENTS.md`
- `CHANGELOG.md`

### Catatan
- Integrasi prakiraan cuaca landing page tidak berubah dan tetap langsung ke API BMKG melalui `lib/bmkgClient.ts`.
- `npm run lint` selesai tanpa error dengan 4 warning lama di luar cakupan perubahan.
- `npm run build` berhasil; daftar route produksi tidak lagi memuat `/admin/prakiraan-cuaca`.

## [Tahap 21] - Perbaikan Dropdown Periode Agregasi - 2026-07-15
### Ditambahkan
- Helper `apiGetAllPages` pada API client terpusat untuk memuat seluruh opsi dari endpoint Laravel yang berpaginasi.
- State error khusus pemuatan opsi agregasi agar kegagalan metadata terlihat oleh admin.

### Diubah
- Dropdown Tahun pada form Proses Agregasi sekarang memakai metadata `periode_sumber` dari data iklim harian dan difilter berdasarkan stasiun terpilih.
- Dropdown Bulan hanya menampilkan bulan sumber yang tersedia untuk kombinasi stasiun dan tahun terpilih.
- Filter Tahun hasil agregasi memakai `tahun_hasil`, terpisah dari periode sumber proses.
- Opsi Dasarian pada halaman Rekomendasi dan opsi Hasil Rekomendasi pada halaman Ringkasan AI memuat semua halaman, bukan hanya 200 baris pertama.
- Opsi periode dan tabel agregasi dimuat ulang setelah proses berhasil.

### File Terkait
- `app/admin/agregasi/page.tsx`
- `app/admin/rekomendasi/page.tsx`
- `app/admin/ringkasan-ai/page.tsx`
- `lib/apiClient.ts`
- `CHANGELOG.md`

### Catatan
- Tidak ada dependency baru.
- `npm run lint` selesai tanpa error (4 warning lama di luar cakupan perubahan).
- `npm run build` berhasil pada Next.js 16.2.10 tanpa error TypeScript maupun kompilasi.

## [Tahap 20] - Konfigurasi Monorepo dan Kolaborasi GitHub - 2026-07-15
### Ditambahkan
- README root, panduan kontribusi, konfigurasi Git bersama, dan template kolaborasi GitHub.

### Diubah
- README frontend diperbarui dengan langkah setup dan verifikasi khusus aplikasi.
- Referensi kontrak API pada `AGENTS.md` diarahkan ke `../API_DOCUMENTATION.md` di root monorepo.

### File Terkait
- `../README.md`
- `../CONTRIBUTING.md`
- `README.md`
- `AGENTS.md`
- `CHANGELOG.md`

### Catatan
- Metadata Git lama frontend dihapus agar seluruh backend, frontend, data, dan dokumentasi dikelola oleh satu repository Git.
- Tidak ada perubahan kode aplikasi, dependency, atau kontrak API frontend.

## [Tahap 19] - Bug Fix: Dropdown Stasiun Setelah Database Fresh - 2026-07-15
### Ditambahkan
- Tidak ada file atau komponen baru pada frontend.

### Diubah
- `app/admin/data-iklim/page.tsx` mengambil opsi stasiun dari endpoint dedicated `GET /admin/stasiun`, bukan mengekstraknya dari baris data iklim harian.
- `app/admin/agregasi/page.tsx` mengambil opsi stasiun dari endpoint dedicated `GET /admin/stasiun`; opsi tahun tetap berasal dari `GET /admin/agregasi?per_page=200`.
- `CHANGELOG.md` ditambahkan entry sesi ini.

### File Terkait
- `app/admin/data-iklim/page.tsx`
- `app/admin/agregasi/page.tsx`
- `CHANGELOG.md`

### Catatan
- Dropdown stasiun tetap terisi dari data seeder meskipun tabel `data_iklim_harian` dan `data_iklim_dasarian` masih kosong.
- Tidak ada perubahan pada tabel, form CRUD, import CSV, filter selain sumber opsi stasiun, komponen UI, maupun API client.
- `npm run build` berhasil tanpa error kompilasi maupun TypeScript.
- `npm run lint` selesai dengan 0 error dan 4 warning lama pada file di luar cakupan perubahan sesi ini.

## [Tahap 18] - Bug Fix: Input Number → Select Dropdown - 2026-07-15
### Diubah
- `app/admin/agregasi/page.tsx` — 4 field diganti dari `<input type="number">` ke `<select>` dropdown:
  - Form "Proses Agregasi" → `stasiun_id`: dropdown stasiun dari API, format "Nama Stasiun (WMO: xxxxx)"
  - Form "Proses Agregasi" → `tahun`: dropdown tahun dari data iklim + agregasi yang ada di database
  - Filter → `stasiun_id`: dropdown stasiun, opsi pertama "Semua"
  - Filter → `tahun`: dropdown tahun, opsi pertama "Semua"
  - Fetch data stasiun dan tahun dari `GET /admin/data-iklim?per_page=200` + `GET /admin/agregasi?per_page=200`
- `app/admin/data-iklim/page.tsx` — 3 field diganti:
  - Filter → `stasiun_id`: dropdown stasiun
  - Form "Input Data Manual" (modal) → `stasiun_id`: dropdown stasiun
  - Form "Import CSV" → `stasiun_id`: dropdown stasiun
  - Fetch data stasiun dari `GET /admin/data-iklim?per_page=200`
- `app/admin/rekomendasi/page.tsx` — 1 field diganti:
  - Filter → `rule_id`: dropdown rule dari `GET /admin/rules`, format "Nama Rule"
- `app/admin/audit-log/page.tsx` — 2 field diganti:
  - Filter → `user_id`: dropdown user dari `GET /admin/users`, format "Nama Lengkap (email)"
  - Filter → `tabel_terkait`: dropdown statis dengan opsi `data_iklim_harian`, `rule_rekomendasi`, `konten_landing_page`, `ringkasan_ai`

### File Terkait
- `app/admin/agregasi/page.tsx`
- `app/admin/data-iklim/page.tsx`
- `app/admin/rekomendasi/page.tsx`
- `app/admin/audit-log/page.tsx`
- `CHANGELOG.md`

### Catatan
- Total 10 field di 4 halaman admin diperbaiki
- Pola implementasi mengikuti referensi yang sudah ada di `rekomendasi/page.tsx` (dropdown `dasarian_id`) dan `ringkasan-ai/page.tsx` (dropdown `hasil_rekomendasi_id`): fetch on mount via `useEffect`, simpan ke state `options`, render sebagai `<select>`
- Dropdown filter menggunakan opsi pertama "Semua" (value kosong); dropdown di form action menggunakan "Pilih..." (value kosong, required)
- Saat loading, opsi pertama menampilkan teks loading: "Memuat stasiun...", "Memuat tahun...", "Memuat rule...", "Memuat user..."
- `<select>` di-disable saat loading (`disabled={optionsLoading}`)
- Stasiun di-fetch dari data iklim/agregasi yang sudah ada karena belum ada endpoint khusus `/api/admin/stasiun`
- Tahun di-derive dari data tanggal harian + tahun agregasi yang sudah tersimpan di database
- Tabel terkait di audit log menggunakan opsi statis (hardcode) karena tabel yang di-observe sudah fixed
- Tidak ada package baru yang diinstall
- Build Next.js berhasil tanpa error TypeScript

## [Tahap 17] - Navbar Atas & Branding Sidebar - 2026-07-13
### Diubah
- `components/Sidebar.tsx` — mengganti search bar (ikon kaca pembesar + "Search for places..." + tombol locate) dengan logo BMKG (SVG inline) + teks "MyFarmer" sebagai branding di bagian atas sidebar. Menghapus import `SearchIcon` dan `LocateIcon` yang tidak lagi dipakai.
- `components/MainContent.tsx` — mengganti tab "Today" / "Week" di area top nav dengan ikon lokasi + nama lokasi aktual dari API BMKG + tanggal/jam WIB di bawahnya. Menambahkan greeting dinamis ("Good Morning..." / "Good Afternoon..." / "Good Evening...") di sebelah kiri toggle °C/°F. Responsif: di mobile (< md) hanya tampil nama kecamatan, di desktop tampil lokasi lengkap + tanggal. Menghapus state `activeTab` dan import `useState` yang tidak lagi dipakai.

### File Terkait
- `components/Sidebar.tsx`
- `components/MainContent.tsx`
- `CHANGELOG.md`

### Catatan
- Tidak ada dependency baru, tidak ada file baru.
- Data lokasi (`wilayah`, `kecamatan`) dan tanggal/waktu (`waktu_prakiraan`) semuanya dari response API BMKG, bukan hardcoded.
- Greeting berdasarkan `new Date().getHours()` browser (otomatis WIB untuk pengguna di Indonesia): < 12 = Morning, 12–16 = Afternoon, ≥ 17 = Evening.
- Logo BMKG berupa SVG inline (lingkaran hitam dengan ellipse berwarna berlapis), ukuran 36×36px.
- Breakpoint responsif lokasi: `md:hidden` (mobile singkat) / `hidden md:flex` (desktop lengkap).

## [Tahap 16] - Footer Publik dan Animasi SVG - 2026-07-08
### Ditambahkan
- Footer publik responsif untuk Stasiun Klimatologi Jawa Timur pada landing page.
- Animasi SVG taman alat klimatologi dari `svg_animated_footer.html` yang tampil sebelum footer.

### Diubah
- `MainContent` merender footer publik setelah section `Today's Highlights`.

### File Terkait
- `components/PublicFooter.tsx`
- `components/MainContent.tsx`
- `CHANGELOG.md`

### Catatan
- Tidak ada dependency baru; animasi memakai CSS lokal pada komponen footer dan menghormati `prefers-reduced-motion`.
- Hak cipta footer: 2026 Stasiun Klimatologi Jawa Timur.

## [Tahap 15] - Section Info Carousel Landing Page - 2026-07-08
### Ditambahkan
- Section `Info` pada landing page, ditempatkan di antara area prakiraan cuaca/ringkasan dan `Today's Highlights`.
- Carousel info horizontal yang memakai isi dan desain card yang sama dengan carousel ringkasan di atas: `Rekomendasi Tanam`, `Ringkasan Iklim (AI)`, `Info Curah Hujan`, `Pengumuman`, dan `Tips`.
- Popup detail info saat card ditekan, memakai desain card yang sama dan tombol `X` untuk menutup.

### Diubah
- `BackendCards` mengekspos `useBackendCards`, `BackendInfoCard`, dan frame konten card agar card publik bisa dipakai ulang oleh section `Info`.
- `MainContent` merender section `Info` sebelum `Today's Highlights`.
- Load awal cuaca publik dibuat tidak memicu error lint React dan error cuaca sekarang diteruskan ke `MainContent`.
- Perbaikan lint kecil pada error boundary dan auto-close sidebar admin saat route berubah.

### File Terkait
- `app/(public)/page.tsx`
- `app/(public)/page_backup.tsx`
- `app/error.tsx`
- `components/InfoSection.tsx`
- `components/BackendCards.tsx`
- `components/MainContent.tsx`
- `components/admin/AdminShell.tsx`
- `CHANGELOG.md`

### Catatan
- Section Info tidak menambah endpoint baru dan tetap memakai endpoint publik tanpa token wajib; data card diambil sekali di `MainContent`, lalu dipakai oleh `BackendCards` dan `InfoSection`.
- Tidak ada dependency baru; animasi memakai state React dan class Tailwind yang sudah ada.

## [Tahap 14] - Penyelarasan Frontend ke Ringkasan Groq Backend - 2026-07-06
### Ditambahkan
- Tidak ada fitur baru. Tahap ini menegaskan di UI bahwa ringkasan AI berasal dari backend yang memakai layanan Groq.

### Diubah
- `app/admin/ringkasan-ai/page.tsx` diperbarui agar deskripsi halaman dan form generate menjelaskan bahwa proses ringkasan berjalan lewat backend Groq, bukan provider lama.
- `app/admin/dashboard/page.tsx` diperbarui agar quick action dan statistik ringkasan lebih jelas mengacu ke ringkasan AI backend.
- `app/(public)/page.tsx` diperbarui agar subtitle section ringkasan publik konsisten menyebut sumber ringkasan berasal dari backend Groq.

### File Terkait
- `app/admin/ringkasan-ai/page.tsx`
- `app/admin/dashboard/page.tsx`
- `app/(public)/page.tsx`
- `CHANGELOG.md`

### Catatan
- Tidak ada perubahan kontrak API frontend karena sejak awal frontend memang memanggil endpoint backend `/api/admin/ringkasan/*` dan `/api/publik/ringkasan-terkini`, bukan memanggil provider AI secara langsung.
- Perubahan ini hanya menyelaraskan label/copy dengan migrasi backend dari Gemini ke Groq.

---
## [Tahap 13] - Integrasi API BMKG Langsung (Tanpa Backend) - 2026-07-06
### Ditambahkan
- `lib/bmkgClient.ts`: Client untuk memanggil API publik BMKG langsung dari browser tanpa melewati backend Laravel. Mentransformasi response BMKG ke format `WeatherSlot` yang dipakai UI. Termasuk timeout handling (10 detik) dan filter hanya prakiraan dari waktu sekarang ke depan.
- Environment variable `NEXT_PUBLIC_BMKG_KODE_ADM4` di `.env.local` dan `.env.example` untuk mengatur kode wilayah ADM4 (default: `35.07.20.2001` — Ngajum, Malang, Jawa Timur)
- Indikator "Live" (titik hijau berkedip) di section cuaca yang menunjukkan data diambil langsung dari BMKG secara real-time
- Auto-refresh cuaca setiap 15 menit tanpa perlu reload halaman
- Metrik tambahan: arah angin dan jarak pandang di setiap card cuaca
- Ikon cuaca resmi dari BMKG (menggantikan emoji)

### Diubah
- `app/(public)/page.tsx` → `WeatherSection`: Sekarang memanggil API BMKG langsung dari browser (`https://api.bmkg.go.id/publik/prakiraan-cuaca`) alih-alih melewati backend (`/api/publik/prakiraan-cuaca`). Menampilkan 9 slot prakiraan (sebelumnya 6). Menampilkan info wilayah + provinsi + indikator Live.

### Dihapus
- Menu "Prakiraan Cuaca" dari sidebar admin (`AdminShell.tsx`) — tidak diperlukan lagi karena data cuaca diambil langsung dari BMKG tanpa intervensi admin

---
## [Tahap 12] - Polish, Responsivitas, dan Review Akhir - 2026-07-05
### Ditambahkan
- Halaman 404 (Not Found) di `app/not-found.tsx`: pesan "Halaman tidak ditemukan" dengan tombol navigasi ke halaman utama dan panel admin, mengikuti design token flat minimalis
- Halaman error umum di `app/error.tsx`: error boundary dengan ikon peringatan, pesan error, kode digest opsional, tombol "Coba Lagi" dan navigasi ke halaman utama
- Mobile sidebar toggle di `AdminShell.tsx`: tombol hamburger (☰) di header mobile membuka sidebar slide-in drawer dengan overlay gelap, tombol close (✕) di dalam sidebar, auto-close saat navigasi ke halaman lain

### Diubah
- `components/admin/AdminShell.tsx`: sidebar sekarang bisa di-toggle di mobile (sebelumnya `hidden md:flex` tanpa cara akses di layar kecil), overlay semi-transparan saat terbuka, sidebar scrollable jika menu melebihi tinggi layar. Mobile header lebih compact: hamburger + nama user + role dalam satu baris
- `app/(public)/page.tsx`: perbaikan responsivitas mobile untuk petani yang akses lewat HP:
  - Hero heading: `text-2xl` di mobile → `text-3xl` di sm → `text-4xl` di md (sebelumnya langsung `text-3xl`)
  - Section heading: `text-xl` di mobile → `text-2xl` di sm (sebelumnya langsung `text-2xl`)
  - Section subtitle: `text-sm` di mobile → `text-base` di sm
  - Padding: `px-4 py-8` di mobile → `px-6 py-10` di sm (sebelumnya `px-6 py-10` langsung)
  - Gap antar section: `gap-8` di mobile → `gap-10` di sm
  - Grid cuaca: 1 kolom di mobile → 2 kolom di sm → 3 kolom di md (sebelumnya langsung 1→3)
  - Grid curah hujan: 1 kolom → 2 kolom di sm → 3 kolom di md
  - Grid konten: 1 kolom → 2 kolom di sm (sebelumnya 1→2 di md)

### File Terkait
- `components/admin/AdminShell.tsx`
- `app/(public)/page.tsx`
- `app/not-found.tsx`
- `app/error.tsx`
- `CHANGELOG.md`

### Catatan — Review Golden Rules Tahap 1-11

**Audit lengkap seluruh Golden Rules dari AGENTS.md:**

1. ✅ **GR#1 — Dua dunia terpisah**: Landing page (`/(public)`) dan admin (`/admin/*`) punya layout, navigasi, dan struktur komponen yang terpisah total
2. ✅ **GR#2 — Landing page tidak memanggil endpoint bertoken**: Hanya `/publik/*` yang dipanggil di `(public)/page.tsx`
3. ✅ **GR#3 — API client terpusat**: Audit `grep` konfirmasi tidak ada `fetch()` langsung di luar `lib/apiClient.ts` di seluruh `app/`
4. ✅ **GR#4 — Base URL dari env var**: Audit `grep` konfirmasi tidak ada `localhost:8000` hardcoded di kode manapun
5. ✅ **GR#5 — Route admin dilindungi**: `AdminShell` redirect ke `/admin/login` jika token tidak ada
6. ✅ **GR#6 — UI sesuai role**: Menu sidebar Kelola User/Audit Log hanya muncul untuk `super_admin`; halaman `users` dan `audit-log` punya proteksi role tambahan di level komponen
7. ✅ **GR#7 — CHANGELOG diperbarui**: Setiap tahap punya entry
8. ✅ **GR#8 — Tidak menerjemahkan istilah tanpa mapping**: `label_rekomendasi` dari backend dipakai langsung
9. ✅ **GR#9 — Kontrak API diikuti apa adanya**: Tidak ada field tambahan yang diasumsikan
10. ✅ **GR#10 — Loading/empty/error state**: Semua halaman yang fetch data punya skeleton loading, empty state, dan error Alert — konsisten memakai `Skeleton`, `Alert`, `Spinner` dari `components/ui.tsx`
11. ✅ **GR#11 — Tidak ada state management library berat**: Hanya React Context dan state lokal
12. ✅ **GR#12 — Komponen terpisah per fungsi**: `components/public/` dan `components/admin/` terpisah

**Perbaikan yang dilakukan di tahap ini:**
- **Sidebar mobile**: Sebelumnya sidebar tersembunyi di mobile tanpa cara akses — sekarang ada hamburger toggle
- **Landing page mobile**: Teks dan grid terlalu besar langsung di layar kecil — sekarang progressive sizing
- **Error pages**: Sebelumnya belum ada — sekarang 404 dan error boundary tersedia
- **Tidak ada pelanggaran Golden Rules yang ditemukan** — semua halaman sudah konsisten

---

## [Tahap 11] - Admin Kelola User, Log Import, dan Audit Log - 2026-07-05
### Ditambahkan
- Halaman admin Kelola User (khusus `super_admin`): CRUD user admin via `GET/POST/PUT/DELETE /admin/users`
- Proteksi role di level halaman: jika `admin` biasa mengakses `/admin/users` atau `/admin/audit-log` langsung (bukan lewat menu), ditampilkan pesan "tidak memiliki izin" — bukan redirect, agar user tahu kenapa diblokir
- Form buat user baru: `nama_lengkap`, `email`, `password`, `role_id` (dropdown admin/super_admin)
- Form edit user: `nama_lengkap`, `password` (opsional), toggle `is_active`; email di-disable saat edit
- Tombol "Nonaktifkan" (soft delete via `DELETE /admin/users/{id}`) dan "Hapus Permanen" (hard delete via `DELETE /admin/users/{id}?force=true`) terpisah dengan konfirmasi
- Proteksi diri sendiri: tombol nonaktifkan/hapus disembunyikan untuk user yang sedang login (label "(Anda)"), error 400 dari backend tetap ditangani
- Badge role: `super_admin` hijau, `admin` kuning; badge aktif/nonaktif konsisten dengan halaman lain
- Halaman admin Log Import (admin & super_admin): tabel read-only dari `GET /admin/log-import`
- Filter log import: `status` (sukses/gagal), `sumber` (teks bebas), `tanggal_mulai`, `tanggal_selesai`, `per_page`
- Badge status import: `sukses` hijau, `gagal` merah
- Halaman admin Audit Log (khusus `super_admin`): tabel read-only dari `GET /admin/audit-log`
- Filter audit log: `user_id`, `tabel_terkait`, `aksi` (created/updated/deleted), `tanggal_mulai`, `tanggal_selesai`, `per_page`
- Detail perubahan (before/after) ditampilkan sebagai expandable row dengan format key-value yang mudah dibaca, bukan JSON mentah
- Badge aksi: `created` hijau, `updated` kuning, `deleted` merah

### Diubah
- `app/admin/users/page.tsx` tidak lagi placeholder dan terhubung ke endpoint CRUD User melalui API client terpusat
- `app/admin/log-import/page.tsx` tidak lagi placeholder dan terhubung ke endpoint Log Import melalui API client terpusat
- `app/admin/audit-log/page.tsx` tidak lagi placeholder dan terhubung ke endpoint Audit Log melalui API client terpusat

### File Terkait
- `app/admin/users/page.tsx`
- `app/admin/log-import/page.tsx`
- `app/admin/audit-log/page.tsx`
- `CHANGELOG.md`

### Catatan
- Proteksi role halaman `users` dan `audit-log` memakai `useAuth()` dari `AuthContext` — cek `nama_role !== "super_admin"` di level komponen page, tampilkan Alert error jika bukan super_admin
- Ini berbeda dari proteksi sidebar (yang menyembunyikan menu) — proteksi di halaman memblokir akses langsung via URL
- Detail audit log memakai label emoji: 🔴 "Sebelum (old)" dan 🟢 "Sesudah (new)" untuk membantu visual diff
- Badge role user: `super_admin` memakai `success-subtle`/`primary`, `admin` memakai `warning-subtle`/`wait`

---

## [Tahap 10] - Admin Konten Landing Page dan Prakiraan Cuaca - 2026-07-05
### Ditambahkan
- Halaman admin Konten Landing Page dengan CRUD lengkap: tabel daftar konten dari `GET /admin/konten`, form buat/edit konten via `POST /admin/konten` dan `PUT /admin/konten/{id}`, hapus konten via `DELETE /admin/konten/{id}`
- Form konten dengan field: `judul` (text), `isi` (textarea), `tipe` (dropdown pengumuman/tips), `is_active` (toggle switch), dan `urutan_tampil` (angka)
- Filter tabel konten: `tipe`, `is_active`, dan `per_page`
- Badge tipe konten: `pengumuman` (hijau) dan `tips` (kuning/oranye)
- Badge status aktif: `Aktif` (hijau) dan `Nonaktif` (abu-abu)
- Konfirmasi hapus konten dengan `window.confirm` sebelum memanggil `DELETE`
- Error validasi per-field dari backend untuk form create/edit konten
- Halaman admin Prakiraan Cuaca dengan tombol "Fetch Data Terbaru dari BMKG" yang memanggil `POST /admin/prakiraan-cuaca/fetch`
- Tampilan hasil fetch: jumlah prakiraan sukses, gagal, nama wilayah, dan kode ADM4 dalam card grid
- Penanganan error 502 (API BMKG down/timeout) dan 422 (kode ADM4 belum dikonfigurasi) dengan pesan jelas
- Card informasi yang menjelaskan bahwa data prakiraan cuaca terpisah dari data iklim harian dan tidak dipakai rule engine

### Diubah
- `app/admin/konten/page.tsx` tidak lagi placeholder dan terhubung ke endpoint CRUD Konten melalui API client terpusat
- `app/admin/prakiraan-cuaca/page.tsx` tidak lagi placeholder dan terhubung ke endpoint Prakiraan Cuaca melalui API client terpusat

### File Terkait
- `app/admin/konten/page.tsx`
- `app/admin/prakiraan-cuaca/page.tsx`
- `CHANGELOG.md`

### Catatan
- Konten: toggle `is_active` memakai custom switch button dengan warna `primary` saat aktif dan `muted/20` saat nonaktif
- Konten: badge tipe `pengumuman` memakai `success-subtle`/`primary`, `tips` memakai `warning-subtle`/`wait`
- Prakiraan cuaca: endpoint `POST /admin/prakiraan-cuaca/fetch` tidak memerlukan request body (kode ADM4 diambil dari config backend)
- Prakiraan cuaca: result card menampilkan `sukses` dengan warna hijau dan `gagal` dengan warna merah jika > 0

---

## [Tahap 9] - Admin Ringkasan AI - 2026-07-05
### Ditambahkan
- Halaman admin Ringkasan AI dengan tabel daftar ringkasan dari `GET /admin/ringkasan` dan filter `status` (draft/published) serta `per_page`
- Form "Generate Ringkasan" dengan dropdown hasil rekomendasi dari `GET /admin/rekomendasi?per_page=200` yang memanggil `POST /admin/ringkasan/generate`
- Penanganan response 409 (duplikasi) dengan pesan error jelas dari backend
- Inline edit form untuk ringkasan berstatus `draft` dengan tiga skenario aksi: edit teks saja, publish saja, atau edit+publish sekaligus via `PUT /admin/ringkasan/{id}`
- Quick Publish button langsung di baris tabel untuk ringkasan draft
- Ringkasan berstatus `published` ditampilkan read-only dengan indikator check icon
- Badge status `draft` (kuning/oranye) dan `published` (hijau) sesuai token Tahap 1
- Badge "Ya" untuk ringkasan yang sudah diedit manual (`is_edited_manual`)

### Diubah
- `app/admin/ringkasan-ai/page.tsx` tidak lagi placeholder dan terhubung ke endpoint Ringkasan AI melalui API client terpusat

### File Terkait
- `app/admin/ringkasan-ai/page.tsx`
- `CHANGELOG.md`

### Catatan
- Dropdown generate mengambil data dari `GET /admin/rekomendasi?per_page=200` untuk mengisi opsi `hasil_rekomendasi_id`
- Label dropdown format: `Rekom #ID — D{dasarian_ke} {Bulan} {Tahun} — {Stasiun}`
- Skenario edit/publish mengikuti 3 pola body di dokumentasi API: `{ringkasan_text}` saja, `{status: "published"}` saja, atau `{ringkasan_text, status: "published"}` sekaligus
- Warna badge status: `draft` memakai `warning-subtle`/`wait`, `published` memakai `success-subtle`/`primary`

---

## [Tahap 8] - Admin Rule Rekomendasi dan Evaluasi - 2026-07-05
### Ditambahkan
- Halaman admin Rule Rekomendasi dengan tabel `GET /admin/rules`, filter `is_active`, form create/edit, dan delete rule
- Form parameter rule per key seperti `min_curah_hujan_dasarian` dan `min_dasarian_berturut`, bukan textarea JSON mentah
- Pembatasan UI berbasis role: `admin` hanya melihat edit parameter/`is_active`, sedangkan tombol `Buat Rule Baru` dan `Hapus` hanya muncul untuk `super_admin`
- Penanganan pesan 403 unauthorized dan 409 rule sudah dipakai pada aksi rule
- Halaman admin Rekomendasi dengan tabel histori `GET /admin/rekomendasi`, filter `dasarian_id`, `rule_id`, dan `status_rekomendasi`
- Form evaluasi rekomendasi ke `POST /admin/rekomendasi/evaluasi` dengan dropdown `dasarian_id` dari data agregasi

### Diubah
- `app/admin/rules/page.tsx` dan `app/admin/rekomendasi/page.tsx` tidak lagi placeholder dan terhubung ke API backend melalui API client terpusat

### File Terkait
- `app/admin/rules/page.tsx`
- `app/admin/rekomendasi/page.tsx`
- `CHANGELOG.md`

### Catatan
- Badge `status_rekomendasi` memakai token Tahap 1: `optimal_tanam` hijau, `tunggu` kuning/oranye, `tidak_disarankan` merah muted.
- Dropdown `dasarian_id` evaluasi diambil dari `GET /admin/agregasi?per_page=200`.

---

## [Tahap 7] - Admin Agregasi Dasarian - 2026-07-05
### Ditambahkan
- Halaman admin Agregasi Dasarian dengan tabel hasil agregasi dari endpoint `GET /admin/agregasi`
- Filter tabel untuk `stasiun_id`, `tahun`, `bulan`, `dasarian_ke`, dan `per_page`
- Form proses agregasi ke endpoint `POST /admin/agregasi/proses` dengan `dasarian_ke` opsional
- Notifikasi sukses dan refresh tabel otomatis setelah proses agregasi berhasil
- Badge `status_musim` untuk `basah`, `normal`, dan `kering`

### Diubah
- `app/admin/agregasi/page.tsx` tidak lagi placeholder dan terhubung ke endpoint Agregasi Dasarian melalui API client terpusat

### File Terkait
- `app/admin/agregasi/page.tsx`
- `CHANGELOG.md`

### Catatan
- Mapping badge `status_musim`: `basah` memakai `success-subtle`/`primary`, `normal` memakai `warning-subtle`/`wait`, dan `kering` memakai `danger-subtle`/`danger`.
- `dasarian_ke` pada form proses boleh dikosongkan; backend akan memproses 3 dasarian sekaligus sesuai kontrak API.

---

## [Tahap 6] - Admin Data Iklim Harian CRUD dan Import CSV - 2026-07-05
### Ditambahkan
- Halaman admin Data Iklim Harian dengan tabel paginated, filter `stasiun_id`, `tanggal`, `tanggal_mulai`, dan `tanggal_selesai`
- Modal form input manual dan edit data iklim harian untuk `stasiun_id`, `tanggal`, `curah_hujan_mm`, dan `kode_status`
- Aksi hapus data iklim harian dengan konfirmasi
- Form import CSV multipart dengan `stasiun_id`, upload file, dan ringkasan hasil import sukses/dilewati/gagal
- Tampilan error validasi per-field dari `ApiError.errors`

### Diubah
- `app/admin/data-iklim/page.tsx` tidak lagi placeholder dan terhubung ke endpoint CRUD/import Data Iklim Harian melalui API client terpusat

### File Terkait
- `app/admin/data-iklim/page.tsx`
- `CHANGELOG.md`

### Catatan
- Endpoint yang dipakai: `GET /admin/data-iklim`, `POST /admin/data-iklim`, `PUT /admin/data-iklim/{id}`, `DELETE /admin/data-iklim/{id}`, dan `POST /admin/data-iklim/import`.
- `stasiun_id` sementara memakai input angka karena bagian kontrak Data Iklim Harian tidak menyediakan endpoint daftar stasiun.

---

## [Tahap 5] - Dashboard Admin Ringkasan - 2026-07-05
### Ditambahkan
- Dashboard admin dengan card statistik untuk total data iklim harian, rule aktif, status ringkasan AI terbaru, dan status import terakhir
- Quick action button menuju Input Data Iklim, Proses Agregasi, dan Generate Ringkasan AI
- Loading skeleton dan alert error untuk proses fetch ringkasan dashboard

### Diubah
- `app/admin/dashboard/page.tsx` tidak lagi placeholder dan mengambil data dari endpoint admin melalui API client terpusat

### File Terkait
- `app/admin/dashboard/page.tsx`
- `CHANGELOG.md`

### Catatan
- Endpoint dashboard: `/admin/data-iklim?per_page=1`, `/admin/rules?is_active=1`, `/admin/ringkasan?per_page=1`, dan `/admin/log-import?per_page=1`.
- Card statistik tetap flat minimalis memakai token Tahap 1 dan komponen reusable `Card`, `Alert`, serta `Skeleton`.

---

## [Tahap 4] - Landing Page Publik - 2026-07-05
### Ditambahkan
- Landing page publik dengan section Cuaca Real-Time, Rekomendasi Tanam, Ringkasan Kondisi Iklim, Info Curah Hujan, serta Pengumuman & Tips
- Loading skeleton dan penanganan kosong/error per section tanpa saling blocking
- Card prakiraan cuaca berisi waktu, suhu, curah hujan, kelembapan, kecepatan angin, dan kondisi cuaca

### Diubah
- `app/(public)/page.tsx` kini mengambil data dari endpoint publik backend melalui API client terpusat

### File Terkait
- `app/(public)/page.tsx`
- `CHANGELOG.md`

### Catatan
- Endpoint publik yang dipakai: `/publik/prakiraan-cuaca`, `/publik/rekomendasi-terkini`, `/publik/ringkasan-terkini`, `/publik/cuaca-terkini`, dan `/publik/konten`.
- Mapping ikon cuaca sederhana: `cerah` => `☀`, `hujan` => `☔`, `cerah berawan` => `⛅`, `berawan`/`mendung` => `☁`, `petir`/`badai` => `⚡`, kondisi lain => `○`.
- `label_rekomendasi` ditampilkan langsung dari backend; warna badge mengikuti token Tahap 1 untuk `optimal_tanam`, `tunggu`, dan `tidak_disarankan`.
---

## [Tahap 3] - Halaman Login Admin - 2026-07-05
### Ditambahkan
- Halaman login admin dengan form email dan password memakai `Card`, `Button`, dan `Alert`
- Penanganan error login dari backend untuk kredensial salah dan akun nonaktif lewat pesan `ApiError.message`

### Diubah
- `AuthContext.logout()` tetap membersihkan sesi lokal meskipun request logout gagal karena token sudah tidak valid/revoked
- Layout admin menampilkan `nama_lengkap` dan `nama_role` di bagian atas sidebar/header admin

### File Terkait
- `app/admin/login/page.tsx`
- `components/admin/AdminShell.tsx`
- `context/AuthContext.tsx`
- `CHANGELOG.md`

### Catatan
- Submit login memakai `AuthContext.login()`, yang memanggil `POST /api/auth/login` melalui API client terpusat dan menyimpan `token` serta `user` ke localStorage.
- Login sukses redirect ke `/admin/dashboard`; logout memanggil `POST /api/auth/logout`, membersihkan AuthContext/localStorage, lalu redirect ke `/admin/login`.

---

## [Tahap 2] - Layout Publik dan Layout Admin - 2026-07-05
### Ditambahkan
- Layout publik dengan header MyFarmer, tagline singkat, dan footer sederhana
- `AuthContext` untuk state `user`, `token`, `nama_role`, `isAuthenticated`, `isReady`, serta fungsi `login()` dan `logout()`
- Layout admin dengan sidebar menu dan proteksi redirect ke `/admin/login` jika belum ada token
- Placeholder halaman untuk menu admin: Dashboard, Data Iklim, Agregasi, Rule Rekomendasi, Rekomendasi, Ringkasan AI, Konten, Prakiraan Cuaca, Log Import, Kelola User, dan Audit Log

### Diubah
- Root layout membungkus aplikasi dengan `AuthProvider`
- Helper auth menambahkan key `AUTH_USER_KEY` untuk menyimpan data user di localStorage
- Halaman publik disesuaikan agar berada di dalam layout publik baru

### File Terkait
- `app/layout.tsx`
- `app/(public)/layout.tsx`
- `app/(public)/page.tsx`
- `app/admin/layout.tsx`
- `app/admin/page.tsx`
- `app/admin/login/page.tsx`
- `app/admin/dashboard/page.tsx`
- `app/admin/data-iklim/page.tsx`
- `app/admin/agregasi/page.tsx`
- `app/admin/rules/page.tsx`
- `app/admin/rekomendasi/page.tsx`
- `app/admin/ringkasan-ai/page.tsx`
- `app/admin/konten/page.tsx`
- `app/admin/prakiraan-cuaca/page.tsx`
- `app/admin/log-import/page.tsx`
- `app/admin/users/page.tsx`
- `app/admin/audit-log/page.tsx`
- `components/admin/AdminShell.tsx`
- `context/AuthContext.tsx`
- `lib/auth.ts`
- `CHANGELOG.md`

### Catatan
- `AuthContext` memakai localStorage key `myfarmer_token` dan `myfarmer_user`; `login(credentials)` memanggil `POST /auth/login`, lalu menyimpan `token` dan `user`; `logout()` memanggil `POST /auth/logout` jika ada token, lalu selalu membersihkan localStorage.
- Sidebar admin memakai `nama_role`; menu `Kelola User` dan `Audit Log` hanya dirender saat `nama_role === "super_admin"`.
- Proteksi route admin tahap ini berbasis token di localStorage; validitas dan otorisasi tetap dikunci oleh backend saat request API.

---

## [Tahap 1] - Setup Awal, Design Token, dan API Client - 2026-07-05
### Ditambahkan
- Environment `.env.local` dan template `.env.example` berisi `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api`
- API client terpusat `lib/apiClient.ts` dan helper token `lib/auth.ts`
- Struktur dasar `app/(public)/`, `app/admin/`, `components/public/`, `components/admin/`, `lib/`, dan `context/`
- Komponen reusable shared UI: `Button`, `Card`, `Alert`, `Spinner`, dan `Skeleton`

### Diubah
- Token Tailwind v4 CSS-first ditentukan di `app/globals.css`
- Root layout memakai satu font sans-serif sistem dan metadata MyFarmer
- Route publik `/` dipindahkan ke `app/(public)/page.tsx`
- `.gitignore` mengizinkan `.env.example` sebagai template environment

### File Terkait
- `app/globals.css`
- `app/layout.tsx`
- `app/(public)/layout.tsx`
- `app/(public)/page.tsx`
- `app/admin/layout.tsx`
- `components/ui.tsx`
- `components/public/.gitkeep`
- `components/admin/.gitkeep`
- `context/.gitkeep`
- `lib/apiClient.ts`
- `lib/auth.ts`
- `.env.local`
- `.env.example`
- `.gitignore`
- `CHANGELOG.md`

### Catatan
- Tailwind CSS sudah terpasang (`tailwindcss` v4 dan `@tailwindcss/postcss`), jadi tidak ada install baru.
- Warna final: background `#F7F8F5`, surface `#FFFFFF`, foreground `#172016`, muted `#5F6B5B`, border `#DDE5D8`, primary/`optimal_tanam` `#2F7D32`, `tunggu` `#A16207`, `tidak_disarankan` `#A24646`, success-subtle `#EAF5EA`, warning-subtle `#FFF6E5`, danger-subtle `#F8EAEA`.
- Radius final: control `0.375rem` (6px), card `0.5rem` (8px). Font final: system sans (`Arial, Helvetica, sans-serif`) via `font-sans`.
- Komponen reusable tahap berikutnya tersedia dari `components/ui.tsx`: `Button`, `Card`, `Alert`, `Spinner`, `Skeleton`.

---

## [Tahap 0] - Inisialisasi Proyek - 2026-07-05
### Ditambahkan
- Project Next.js default sudah dibuat oleh developer (`create-next-app` atau setara)
- File `API_DOCUMENTATION.md` (dokumentasi 36 endpoint backend Laravel) ditaruh di root project sebagai referensi kontrak API
- File `AGENTS.md` ditambahkan sebagai aturan paten proyek frontend
- File `CHANGELOG.md` ini dibuat sebagai log konteks antar sesi Codex

### File Terkait
- `API_DOCUMENTATION.md`
- `AGENTS.md`
- `CHANGELOG.md`

### Catatan
- Backend (Laravel, project terpisah `myfarmer`) sudah selesai dikerjakan lebih dulu â€” 36 endpoint tersedia dan siap dipanggil
- Frontend akan punya dua area terpisah dalam satu project: landing page publik (`/`) untuk petani, dan panel admin (`/admin/*`) untuk admin/super_admin
- Desain: flat minimalis (detail token warna/font akan ditentukan dan dicatat di Tahap 1)
- Tahap berikutnya: setup Tailwind (jika belum ada), API client terpusat, struktur folder dasar, dan design token (Tahap 1)
