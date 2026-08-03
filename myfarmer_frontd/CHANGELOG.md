# CHANGELOG â€” MyFarmer Frontend (myfarmer_frontd)

Semua perubahan penting pada frontend proyek MyFarmer dicatat di file ini.
GPT Codex WAJIB membaca file ini di awal setiap sesi dan menambahkan entry baru di setiap akhir sesi (lihat aturan di `AGENTS.md` bagian 8).

Format tanggal: YYYY-MM-DD.

---

## [Unreleased]

## [Tahap 54] - Toggle Total Curah Hujan Alternatif - 2026-08-03
### Ditambahkan
- Toggle aksesibel `Gunakan Total Curah Hujan Alternatif` pada form rule rekomendasi.
- Status aktif/nonaktif kriteria total alternatif pada ringkasan parameter tabel rule.

### Diubah
- Payload create/update rule mengirim `pakai_kriteria_total_alternatif` sebagai boolean.
- Input batas total alternatif dinonaktifkan secara visual ketika fallback tidak digunakan, tetapi nilainya tetap tersimpan agar dapat diaktifkan kembali.
- Tipe respons grafik publik diselaraskan dengan field `kriteria_total_alternatif_aktif` dari backend.

### File Terkait
- `app/admin/rules/page.tsx`
- `components/RainfallRecommendationChart.tsx`
- `CHANGELOG.md`

### Catatan
- Nilai awal toggle aktif untuk mempertahankan perilaku rule lama.
- Verifikasi berhasil: TypeScript, build produksi Next.js 16.2.10, dan ESLint tanpa error; satu warning lama tetap ada pada `page_backup.tsx`.

## [Tahap 53] - Timeout Import CSV Frontend - 2026-08-02
### Diubah
- Request import CSV kini menggunakan `AbortSignal.timeout(180_000)` (3 menit) untuk mencegah hanging tanpa batas saat backend memproses file besar di Railway.

### File Terkait
- `app/admin/data-iklim/page.tsx`
- `CHANGELOG.md`

### Catatan
- Sebelumnya `fetch()` tidak punya timeout, sehingga jika koneksi terputus oleh proxy/gateway, browser menampilkan error generik yang membingungkan ("Import CSV gagal") padahal data sudah masuk di backend.
- Verifikasi TypeScript clean, tidak ada error kompilasi.

## [Tahap 52] - Penyederhanaan Dialog Keluar - 2026-08-01
### Diubah
- Teks penjelasan dan pemberitahuan generik dihapus dari dialog konfirmasi keluar agar tampil lebih ringkas.
- `ConfirmDialog` mendukung penyembunyian pemberitahuan secara opsional tanpa mengubah tampilan dialog lain.

### File Terkait
- `components/admin/AdminShell.tsx`
- `components/admin/AdminUI.tsx`
- `CHANGELOG.md`

### Catatan
- Dialog konfirmasi untuk tindakan penghapusan tetap menampilkan penjelasan dan pemberitahuan seperti sebelumnya.
- Verifikasi TypeScript, pemeriksaan whitespace, dan build produksi Next.js 16.2.10 berhasil; ESLint tanpa error dengan satu warning lama pada `page_backup.tsx`.

## [Tahap 51] - Konfirmasi Keluar Panel Admin - 2026-08-01
### Diubah
- Tombol `Keluar` kini membuka dialog konfirmasi sebelum mengakhiri sesi admin.
- Dialog menampilkan status proses saat logout berlangsung untuk mencegah aksi berulang.

### File Terkait
- `components/admin/AdminShell.tsx`
- `CHANGELOG.md`

### Catatan
- Implementasi menggunakan kembali komponen `ConfirmDialog`; alur autentikasi, endpoint logout, dan arsitektur proyek tidak berubah.
- Verifikasi TypeScript, pemeriksaan whitespace, dan build produksi Next.js 16.2.10 berhasil; ESLint tanpa error dengan satu warning lama pada `page_backup.tsx`.

## [Tahap 50] - Perbaikan Tanggal Form Edit Data Iklim - 2026-08-01
### Diubah
- Nilai tanggal pada form edit Data Iklim dinormalisasi ke format `Y-m-d` agar tetap terisi ketika API mengirim tanggal dalam format ISO lengkap.

### File Terkait
- `app/admin/data-iklim/page.tsx`
- `CHANGELOG.md`

### Catatan
- Perubahan hanya diterapkan saat membuka form edit; endpoint, payload, dan struktur halaman tidak berubah.
- Verifikasi normalisasi tanggal ISO dan `Y-m-d`, TypeScript, pemeriksaan whitespace, serta build produksi Next.js 16.2.10 berhasil; ESLint tanpa error dengan satu warning lama pada `page_backup.tsx`.

## [Tahap 49] - Tutup Modal Setelah Import Berhasil - 2026-07-31
### Diubah
- Modal Import CSV otomatis ditutup setelah backend menyatakan proses import berhasil.
- Pesan hasil import tetap ditampilkan melalui notifikasi halaman setelah modal tertutup; kegagalan tetap mempertahankan modal agar input dapat diperbaiki.

### File Terkait
- `app/admin/data-iklim/page.tsx`
- `CHANGELOG.md`

### Catatan
- Endpoint, payload, validasi file, dan pemuatan ulang tabel tidak berubah.
- Verifikasi berhasil: TypeScript, pemeriksaan jalur sukses/error, dan build produksi Next.js 16.2.10 lulus; ESLint tanpa error dengan satu warning lama pada `page_backup.tsx`.

## [Tahap 48] - Modal Import CSV Data Iklim - 2026-07-31
### Diubah
- Tombol `Import CSV` dipindahkan ke header halaman Data Iklim, tepat di sebelah kiri tombol `Input Data Manual`.
- Form import CSV kini ditampilkan dalam modal yang konsisten dengan form input manual, termasuk validasi, status proses, dan ringkasan hasil import.
- Section Import CSV lama di bawah tabel dihapus tanpa mengubah endpoint maupun batas file 5 MB.

### File Terkait
- `app/admin/data-iklim/page.tsx`
- `CHANGELOG.md`

### Catatan
- Modal mempertahankan pilihan stasiun, upload CSV/TXT, pesan error, dan ringkasan jumlah sukses, dilewati, serta gagal.
- Verifikasi berhasil: TypeScript, pemeriksaan whitespace, dan build produksi Next.js 16.2.10 lulus; ESLint tanpa error dengan satu warning lama pada `page_backup.tsx`.

## [Tahap 47] - URL Sumber Konten Opsional - 2026-07-30
### Diubah
- Isian URL sumber pada form poster dan PDF tidak lagi ditandai wajib dan sekarang menjelaskan bahwa alamat bersifat opsional.

### File Terkait
- `components/admin/ContentManager.tsx`
- `CHANGELOG.md`

### Catatan
- Komponen publik poster dan PDF sebelumnya sudah menyembunyikan tombol `Kunjungi Sumber` ketika `url_sumber` kosong, sehingga tidak diperlukan perubahan render tambahan.
- Verifikasi berhasil: TypeScript dan build produksi Next.js 16.2.10 lulus; ESLint tanpa error dengan satu warning lama pada `page_backup.tsx`.

## [Tahap 46] - Keterangan Musim Tanam pada Card Rekomendasi - 2026-07-30
### Ditambahkan
- Keterangan konteks MT1 pada card rekomendasi landing page dengan bahasa sederhana untuk petani.

### Diubah
- Card rekomendasi menampilkan `Sudah memasuki musim tanam`, peringatan kondisi hujan yang belum mencukupi di dalam MT1, atau `Di luar musim tanam` berdasarkan respons backend.
- Warna keterangan mengikuti konteks: hijau untuk optimal di dalam MT1, kuning untuk belum optimal di dalam MT1, dan netral untuk di luar MT1.

### File Terkait
- `components/BackendCards.tsx`
- `CHANGELOG.md`

### Catatan
- Status utama dan label rekomendasi lama tetap dipertahankan; keterangan MT1 merupakan informasi pendamping, bukan pengganti hasil rule engine.
- Card tetap kompatibel ketika backend lama belum mengirim `kalender_mt1` karena field tersebut ditangani sebagai opsional.
- Verifikasi berhasil: TypeScript dan build produksi Next.js 16.2.10 lulus; ESLint tanpa error dengan satu warning lama pada `page_backup.tsx`.

## [Tahap 45] - Konfigurasi dan Penanda Rentang MT1 - 2026-07-30
### Ditambahkan
- Kontrol bulan dan periode untuk mengatur awal serta akhir Musim Tanam Pertama pada form Rule Rekomendasi.
- Latar hijau muda `#e8f5e9` pada setiap dasarian grafik yang ditandai backend sebagai bagian dari MT1, beserta legenda sederhana `Rentang MT1`.

### Diubah
- Payload create/update rule dan ringkasan parameter pada tabel admin sekarang menyertakan empat parameter kalender MT1.
- Grafik membaca field `dalam_mt1` dari endpoint publik sehingga rentang lintas tahun tetap mengikuti keputusan backend.

### File Terkait
- `app/admin/rules/page.tsx`
- `components/RainfallRecommendationChart.tsx`
- `CHANGELOG.md`

### Catatan
- Nilai awal form mengikuti konfigurasi backend: November periode 1 sampai April periode 2 dan dapat diubah admin.
- TypeScript dan build produksi Next.js 16.2.10 lulus; ESLint tanpa error dengan satu warning lama pada `page_backup.tsx`.
- Pemeriksaan browser headless terhadap 36 periode aktual memastikan bidang hijau dimulai pada November periode 1, sementara lonjakan Oktober tetap berada di luar MT1 dan sumbu grafik tetap terlihat.

## [Tahap 44] - Penjelasan Fallback Total CH Alternatif - 2026-07-30
### Diubah
- Petunjuk parameter `Total Curah Hujan Alternatif` menegaskan bahwa nilai tersebut hanya diperiksa ketika kriteria utama gagal.

### File Terkait
- `app/admin/rules/page.tsx`
- `CHANGELOG.md`

### Catatan
- Perubahan hanya menyelaraskan penjelasan UI dengan rule engine; struktur form dan payload API tetap sama.
- Verifikasi berhasil: TypeScript dan build produksi Next.js 16.2.10 lulus; ESLint tanpa error dengan satu warning lama pada `page_backup.tsx`.

## [Tahap 43] - Sumbu Grafik Tetap Saat Digeser - 2026-07-30
### Ditambahkan
- Lapisan sumbu vertikal tetap untuk angka curah hujan di sisi kiri dan jumlah hari hujan di sisi kanan grafik.

### Diubah
- Scroll horizontal kini hanya menggeser periode dan plot grafik, sementara angka pada kedua sumbu tetap terlihat di tepi kartu.

### File Terkait
- `components/RainfallRecommendationChart.tsx`
- `CHANGELOG.md`

### Catatan
- Lapisan sumbu tidak menangkap interaksi pointer sehingga tooltip dan fungsi geser grafik tetap dapat digunakan seperti sebelumnya.
- Verifikasi berhasil menggunakan 36 periode aktual: kedua sumbu terlihat tetap pada pemeriksaan browser headless, ESLint tanpa error (satu warning lama pada `page_backup.tsx`), TypeScript lulus, dan build produksi Next.js 16.2.10 berhasil.

## [Tahap 42] - Posisi Awal Grafik pada Periode Terbaru - 2026-07-30
### Ditambahkan
- Pengaturan posisi scroll awal grafik secara otomatis ke sisi paling kanan setelah data dan grafik selesai dimuat.

### Diubah
- Grafik 36 dasarian kini langsung menampilkan periode paling baru saat halaman pertama kali dibuka, sementara periode lama tetap dapat dilihat dengan menggeser grafik ke kiri.

### File Terkait
- `components/RainfallRecommendationChart.tsx`
- `CHANGELOG.md`

### Catatan
- Perpindahan posisi dilakukan tanpa animasi agar periode pertama yang terlihat setelah pemuatan adalah data terbaru.
- Verifikasi berhasil: ESLint tanpa error (satu warning lama pada `page_backup.tsx`), TypeScript lulus, dan build produksi Next.js 16.2.10 berhasil untuk seluruh route.

## [Tahap 41] - Grafik Curah Hujan Satu Tahun - 2026-07-30
### Ditambahkan
- Tampilan histori curah hujan lengkap selama satu tahun yang mencakup maksimal 36 dasarian.

### Diubah
- Nilai default `RainfallRecommendationChart` dari 12 menjadi 36 periode sehingga landing page dan dashboard admin meminta seluruh dasarian satu tahun dari endpoint publik.
- Ukuran kartu dan jarak antartitik grafik tetap dipertahankan; data yang melebihi lebar kartu dapat dilihat melalui scroll horizontal yang sudah tersedia.

### File Terkait
- `components/RainfallRecommendationChart.tsx`
- `CHANGELOG.md`

### Catatan
- Endpoint tetap memakai `GET /publik/grafik-curah-hujan` dengan `jumlah_periode=36`, sesuai batas maksimum pada kontrak backend.
- Verifikasi berhasil: ESLint tanpa error (satu warning lama pada `page_backup.tsx`), TypeScript lulus, dan build produksi Next.js 16.2.10 berhasil untuk seluruh route.

## [Tahap 40] - Pembaruan Konten Footer Landing Page - 2026-07-29
### Ditambahkan
- Informasi jam pelayanan kantor, alamat lengkap, koordinat, kontak WhatsApp/telepon/faksimile, tiga alamat email, alamat website, sembilan kanal media sosial, dan enam link layanan BMKG pada footer publik.
- Peta Google Maps responsif dengan pemuatan malas serta link langsung menuju lokasi Stasiun Klimatologi Jawa Timur.

### Diubah
- Konten footer generik `Layanan`, `Informasi`, dan ajakan menuju halaman utama diganti dengan informasi resmi dari footer referensi `profil and footer.html`.
- Susunan isi footer dibuat responsif dalam kelompok alamat/peta, jam layanan/telepon, serta kelompok tautan tanpa mengubah ilustrasi animasi, logo, warna navy, tipografi, atau aksen hijau footer yang sudah ada.

### File Terkait
- `components/PublicFooter.tsx`
- `CHANGELOG.md`

### Catatan
- Seluruh link kontak dapat diklik, sedangkan link website, media sosial, Google Maps, dan layanan BMKG dibuka di tab baru.
- Verifikasi berhasil: ESLint tanpa error (satu warning lama pada `page_backup.tsx`), TypeScript lulus, dan build produksi Next.js 16.2.10 berhasil untuk seluruh route.

## [Tahap 39] - Media Dinamis Landing Page - 2026-07-28
### Ditambahkan
- Komponen publik terpisah untuk Sorotan story, viewer story, carousel dan popup Poster, serta viewer PDF native browser.
- Hook dan kontrak TypeScript media melalui API client terpusat `GET /publik/media`.
- `ContentManager` untuk pengelolaan konten bertab: Pengumuman & Tips, Sorotan, Poster, dan PDF.
- Preview file lama/baru, upload multipart, toggle aktif, urutan, error validasi, loading, notifikasi, dan konfirmasi hapus pada panel admin.

### Diubah
- `MainContent` menempatkan media setelah seluruh card prakiraan/cuaca dan tepat sebelum `PublicFooter`, dengan urutan Sorotan, Poster, lalu PDF.
- Halaman admin Konten menggunakan manager bertab tanpa mengubah menu atau shell admin.

### File Terkait
- `app/admin/konten/page.tsx`
- `components/MainContent.tsx`
- `components/admin/ContentManager.tsx`
- `components/public/media/LandingMediaSection.tsx`
- `components/public/media/MediaModal.tsx`
- `components/public/media/StoryHighlights.tsx`
- `components/public/media/StoryViewerModal.tsx`
- `components/public/media/PosterCarousel.tsx`
- `components/public/media/PosterModal.tsx`
- `components/public/media/PdfViewerSection.tsx`
- `components/public/media/useLandingMedia.ts`
- `lib/media.ts`
- `CHANGELOG.md`

### Catatan
- Palet landing page yang dipakai tetap hijau Tahap 34 (`#16A34A`, `#15803D`, latar `#F0F4F1`) dan tidak ada dependency baru.
- Modal menangani Escape, focus trap, pengembalian fokus, label dialog, dan navigasi keyboard. Autoplay gambar dihentikan saat `prefers-reduced-motion`; video memakai `preload="metadata"`.
- Verifikasi berhasil: ESLint tanpa error (satu warning lama pada `page_backup.tsx`), TypeScript lulus, dan build produksi Next.js 16.2.10 berhasil untuk seluruh route.
- Browser headless memverifikasi viewport desktop 1440x1000, tablet 768x900, dan mobile 390x844 tanpa overflow; carousel menghasilkan 3/2/1 kolom, modal Story/Poster menutup dengan Escape dan mengembalikan fokus, link eksternal aman, serta iframe dan fallback PDF tersedia. Seluruh fixture verifikasi sudah dibersihkan.

## [Tahap 38] - Penyelarasan Nilai Card Sorotan Cuaca - 2026-07-28
### Ditambahkan
- Tidak ada komponen atau dependency baru.

### Diubah
- Card `Kondisi Angin`, `Kelembapan`, dan `Jarak Pandang` menggunakan area nilai `flex-1` yang sama dan dipusatkan secara vertikal.
- Nilai arah angin aktual dipindahkan ke sisi kanan header card agar tidak mendorong posisi nilai kecepatan angin.
- Nilai dan satuan kecepatan angin dibuat tidak membungkus saat berbagi ruang dengan kompas.

### File Terkait
- `components/MainContent.tsx`
- `CHANGELOG.md`

### Catatan
- Ukuran nilai, data BMKG, kompas, dan susunan tiga card tetap dipertahankan; perubahan hanya menyelaraskan posisi vertikal nilai utama.
- Panel admin dan komponen selain card sorotan landing page tidak berubah.

## [Tahap 37] - Penyederhanaan Card Sorotan Cuaca - 2026-07-28
### Ditambahkan
- Tidak ada komponen atau dependency baru.

### Diubah
- Ukuran nilai utama pada card `Kondisi Angin`, `Kelembapan`, dan `Jarak Pandang` dinaikkan dari 34 piksel menjadi 40 piksel agar lebih proporsional.
- Ukuran satuan kecepatan angin dan kelembapan dinaikkan dari 14 piksel menjadi 15 piksel.
- Nilai kelembapan dan jarak pandang diposisikan seimbang secara vertikal setelah teks keterangan bawah dihapus.

### Dihapus
- Teks `Arah angin` pada card `Kondisi Angin`; nilai arah aktual tetap ditampilkan.
- Teks `Normal` pada card `Kelembapan`.
- Teks `Rata-rata` pada card `Jarak Pandang`.

### File Terkait
- `components/MainContent.tsx`
- `CHANGELOG.md`

### Catatan
- Perubahan hanya memengaruhi presentasi tiga card sorotan di landing page; data BMKG, grafik, dan panel admin tidak berubah.

## [Tahap 36] - Penyesuaian Tampilan Jarak Pandang BMKG - 2026-07-28
### Ditambahkan
- Tidak ada komponen atau dependency baru.

### Diubah
- Card `Jarak Pandang` pada landing page kini menampilkan nilai `vs_text` persis seperti yang dikirim API BMKG.

### Dihapus
- Penghapusan teks `km` dan penambahan satuan `km` secara manual pada card jarak pandang.

### File Terkait
- `components/MainContent.tsx`
- `CHANGELOG.md`

### Catatan
- Format dan satuan jarak pandang sekarang sepenuhnya mengikuti respons BMKG, termasuk apabila BMKG mengirim nilai dalam meter atau kilometer.
- Tidak ada perubahan pada request API, transformasi data cuaca, maupun panel admin.

## [Tahap 35] - Penghapusan Informasi Curah Hujan Duplikat - 2026-07-28
### Ditambahkan
- Tidak ada komponen atau dependency baru.

### Diubah
- Grid sorotan landing page disesuaikan dari empat menjadi tiga kolom pada layar lebar setelah card curah hujan dihapus.

### Dihapus
- Card `Curah Hujan` pada bagian `Sorotan Hari Ini` di landing page.
- Informasi curah hujan beserta ikonnya pada side panel landing page.
- Perhitungan lokal `hasRain` dan nilai `rainInfo` yang tidak lagi digunakan.

### File Terkait
- `components/MainContent.tsx`
- `components/Sidebar.tsx`
- `CHANGELOG.md`

### Catatan
- Grafik `Curah Hujan 10 Harian & Rekomendasi Tanam` dan card backend `Info Curah Hujan` tetap dipertahankan karena merupakan fitur terpisah dari dua informasi yang dihapus.
- Tidak ada perubahan pada endpoint, pengambilan data, panel admin, maupun komponen lain.

## [Tahap 34] - Penyesuaian Warna Hijau Landing Page - 2026-07-28
### Ditambahkan
- Varian aksen `green` pada `RainfallRecommendationChart` agar palet landing page dapat diterapkan tanpa mengubah warna grafik pada Dashboard admin.

### Diubah
- Warna landing page diselaraskan dengan landing page proyek referensi `PKL_BMKG_UINMA_2026`, mencakup sidebar, latar halaman, kontrol satuan suhu, kartu informasi, navigasi carousel, aksen grafik, dan tombol footer.
- Perubahan dibatasi pada warna; struktur, ukuran, tipografi, teks, data, dan perilaku komponen dipertahankan.

### File Terkait
- `components/Sidebar.tsx`
- `components/MainContent.tsx`
- `components/BackendCards.tsx`
- `components/InfoSection.tsx`
- `components/RainfallRecommendationChart.tsx`
- `components/PublicFooter.tsx`
- `CHANGELOG.md`

### Catatan
- Palet referensi utama: hijau `#16A34A`, hijau gelap `#15803D`, sidebar `#168039` ke `#0A3A19`, latar `#F0F4F1`, teks utama `#0F1F17`, dan teks muted `#6B8F78`.
- Panel admin tidak diubah; pemanggilan grafik dari Dashboard tetap menggunakan varian warna default.

## [Tahap 33] - Integrasi Ikon SVG Cuaca AM/PM ke Landing Page - 2026-07-22
### Ditambahkan
- `lib/weatherIcons.ts` — utilitas terpusat mapping `kondisi_cuaca` BMKG → path file SVG dengan logika AM/PM (06:00–17:59 = siang, 18:00–05:59 = malam).
- `components/WeatherIcon.tsx` — komponen reusable untuk menampilkan ikon cuaca SVG berdasarkan kondisi dan waktu prakiraan.
- 24 file ikon SVG cuaca di `public/icons/weather/am/` dan `public/icons/weather/pm/` (12 kondisi × 2 periode), dengan style flat modern: gradient lembut, bentuk rounded, tanpa outline.

### Diubah
- `components/Sidebar.tsx` — ikon cuaca hero (160px) dan ikon detail kondisi (20px) sekarang dinamis berdasarkan `kondisi_cuaca` dan `waktu_prakiraan` dari BMKG, menggantikan ikon CSS statis yang selalu sama.
- `components/MainContent.tsx` — ikon cuaca di hero mobile dan kartu prakiraan mingguan sekarang menggunakan `WeatherIcon` dengan dukungan AM/PM; fungsi `getWeatherIcon()` lama dihapus; `getDailyForecasts` sekarang meneruskan `waktu_prakiraan` untuk logika periode.
- `components/RainfallRecommendationChart.tsx` — `RainCloudIcon` diganti inline SVG karena komponen lama dihapus.
- `app/globals.css` — dihapus ~120 baris CSS cuaca lama (`.weather-hero`, `.sun`, `.cloud-back`, `.rain-lines`, `.mini-sun`, `.mini-cloud`, `.mini-rain`, `.mini-drizzle`) yang sudah tidak dipakai.
- `components/Icons.tsx` — dihapus 9 komponen ikon cuaca yang tidak terpakai (`MostlyCloudyIcon`, `RainCloudIcon`, `CloudBack`, `MiniCloud`, `SnowIcon`, `WindIcon`, `SunriseIcon`, `SunsetIcon`, `UVGauge`); tersisa `MenuIcon`, `CloseIcon`, `LocationCityScape`, `SearchIcon`, `LocateIcon`.

### File Terkait
- lib/weatherIcons.ts
- components/WeatherIcon.tsx
- components/Sidebar.tsx
- components/MainContent.tsx
- components/RainfallRecommendationChart.tsx
- components/Icons.tsx
- app/globals.css
- public/icons/weather/am/*.svg (12 file)
- public/icons/weather/pm/*.svg (12 file)

### Catatan
- Mapping 12 kondisi cuaca BMKG: Cerah, Cerah Berawan, Berawan, Berawan Tebal, Udara Kabur, Kabut, Asap, Hujan Ringan, Hujan Sedang, Hujan Lebat, Hujan Lokal, Hujan Petir.
- Fallback ke `berawan.svg` jika kondisi tidak dikenali.
- Ikon AM menggunakan palet matahari (kuning-oranye `#FFD93D`→`#F5A623`) dan awan biru muda (`#D6EAFF`→`#A8D4FF`).
- Ikon PM menggunakan bulan sabit (gold `#F5E6A3`→`#E8C84A` dengan SVG mask) dan awan biru-slate lebih gelap (`#C2D6EC`→`#95B4D4`).

## [Tahap 32] - Lokalisasi Teks Landing Page - 2026-07-21
### Ditambahkan
- Tidak ada komponen atau dependency baru.

### Diubah
- Teks antarmuka berbahasa Inggris pada prakiraan cuaca, sapaan, sorotan, dan ringkasan kondisi cuaca disesuaikan ke Bahasa Indonesia.
- Nama hari pendek dan panjang pada card cuaca serta sidebar menggunakan locale Indonesia.
- Satuan kecepatan angin pada tampilan disesuaikan dari `km/h` menjadi `km/jam`.

### File Terkait
- `components/MainContent.tsx`
- `components/Sidebar.tsx`
- `CHANGELOG.md`

### Catatan
- Perubahan hanya mencakup bahasa pada lapisan presentasi; logika pengambilan, filter, pengelompokan, perhitungan, dan interval data tidak diubah.
- Format tanggal navbar, pembagian waktu sapaan, label aksesibilitas footer, istilah BMKG/WMO/AI/MyFarmer, serta kondisi cuaca dari BMKG dipertahankan.

## [Tahap 31] - Verifikasi End-to-End Panel Admin - 2026-07-20
### Ditambahkan
- Tidak ada komponen atau perubahan kode aplikasi baru.

### Diubah
- Tidak ada endpoint, payload, tampilan, atau logika bisnis yang diubah pada tahap verifikasi ini.

### File Terkait
- `CHANGELOG.md`

### Catatan
- Seluruh 38 route API diverifikasi melalui server runtime menggunakan akun super admin: 47 pemeriksaan berhasil tanpa kegagalan, termasuk CRUD, filter, pagination, import CSV, agregasi, evaluasi rule, integrasi Groq, publish ringkasan, audit, dan logout.
- Suite backend berhasil dengan 51 test dan 146 assertion.
- Smoke test browser berhasil pada seluruh 10 halaman admin tanpa error respons API atau overflow; modal, form, dialog konfirmasi non-destruktif, drawer mobile 390 piksel, dan logout turut diverifikasi.
- Semua user, data iklim, agregasi, rule, rekomendasi, ringkasan, konten, log, audit, dan token sementara hasil pengujian telah dibersihkan.

## [Tahap 30] - Penyelarasan UI Panel Admin - 2026-07-20
### Ditambahkan
- Komponen UI admin reusable untuk header halaman, field form, panel filter, badge status, empty state, pagination, modal aksesibel, dialog konfirmasi, toast, dan ikon konsisten.
- Pagination pada seluruh halaman admin yang memakai endpoint berpaginasi.

### Diubah
- Shell admin disusun ulang menjadi navigasi berkelompok dengan identitas BMKG/MyFarmer, breadcrumb desktop, profil peran yang lebih ramah, dan drawer mobile.
- Halaman login, dashboard, serta seluruh halaman `/admin/*` diselaraskan ke sistem visual yang lebih profesional, datar, responsif, dan konsisten.
- Tabel memakai header sticky, label kolom aksesibel, hover state, empty state, serta area scroll horizontal terlokalisasi pada layar sempit.
- Modal data iklim dan rules memakai dialog aksesibel; konfirmasi native untuk penghapusan/nonaktif pengguna diganti dengan dialog aplikasi tanpa mengubah alur API.
- Font fallback global diperbaiki ke system font yang tersedia dan focus state tombol distandarkan.

### File Terkait
- `app/globals.css`
- `app/admin/login/page.tsx`
- `app/admin/dashboard/page.tsx`
- `app/admin/agregasi/page.tsx`
- `app/admin/audit-log/page.tsx`
- `app/admin/data-iklim/page.tsx`
- `app/admin/konten/page.tsx`
- `app/admin/log-import/page.tsx`
- `app/admin/rekomendasi/page.tsx`
- `app/admin/ringkasan-ai/page.tsx`
- `app/admin/rules/page.tsx`
- `app/admin/users/page.tsx`
- `components/admin/AdminShell.tsx`
- `components/admin/AdminUI.tsx`
- `components/ui.tsx`
- `CHANGELOG.md`

### Catatan
- Endpoint, payload, autentikasi, pemeriksaan peran, dan logika bisnis tidak diubah.
- `npx tsc --noEmit`, `npm run lint`, dan `npm run build` berhasil; lint menyisakan 3 warning lama di luar cakupan perubahan.
- Render runtime terautentikasi diverifikasi pada lebar 1440, 1024, dan 390 piksel tanpa overflow halaman; drawer mobile serta tampilan login juga diperiksa.

## [Tahap 29] - Transisi Carousel Info Simultan - 2026-07-20
### Ditambahkan
- Tidak ada komponen atau dependency baru.

### Diubah
- Seluruh posisi card pada section Info memakai anchor `left` agar browser dapat menginterpolasi perpindahan tanpa loncatan.
- Card aktif bergerak ke kiri dan menyempit dari 62% menjadi 38% bersamaan dengan card berikutnya yang masuk dari kanan.
- Class `hidden`, pergantian anchor `left`/`right`, dan efek skala card kecil dihapus agar tidak menimbulkan jeda visual.
- Durasi transisi diubah menjadi 1 detik dengan easing `ease-in-out` untuk pergerakan yang lebih lembut.

### File Terkait
- `components/InfoSection.tsx`
- `CHANGELOG.md`

### Catatan
- Interval pergantian otomatis tetap 4,5 detik; perubahan hanya memengaruhi animasi perpindahan antar-card.
- Pada layar mobile, card lama keluar ke kiri bersamaan dengan card baru yang masuk dari kanan.
- Render browser memverifikasi card kecil dan card utama menempati lebar 38% + 62% tanpa celah di antara keduanya.
- `npx tsc --noEmit` dan `npm run build` berhasil tanpa error.
- `npm run lint` selesai tanpa error dengan 4 warning lama di luar cakupan perubahan.

## [Tahap 28] - Pemisahan Konten Carousel dan Perbaikan Card Tunggal - 2026-07-20
### Ditambahkan
- Penanganan card tunggal agar satu pengumuman atau tips tetap terlihat pada carousel pertama.

### Diubah
- Carousel di samping prakiraan mingguan hanya menampilkan pengumuman dan tips.
- Section Info hanya menampilkan rekomendasi tanam, ringkasan iklim AI, dan info curah hujan.
- Animasi keluar carousel hanya diterapkan ketika tersedia lebih dari satu card.

### File Terkait
- `components/BackendCards.tsx`
- `components/MainContent.tsx`
- `CHANGELOG.md`

### Catatan
- Endpoint publik terverifikasi mengembalikan satu pengumuman aktif; sebelumnya card tunggal tersembunyi karena kondisi animasi.
- Interval carousel dan kontrak API tidak berubah.
- Render browser dengan data backend aktual berhasil menampilkan `Peringatan Sistem` pada carousel pertama dan tidak menampilkannya di section Info.
- `npx tsc --noEmit` dan `npm run build` berhasil tanpa error.
- `npm run lint` selesai tanpa error dengan 4 warning lama di luar cakupan perubahan.

## [Tahap 27] - Penggantian Logo Landing Page - 2026-07-20
### Ditambahkan
- Aset logo resmi BMKG berformat PNG dengan latar transparan untuk branding landing page.

### Diubah
- Logo ilustrasi pada side panel MyFarmer diganti dengan aset logo BMKG.
- Placeholder `SK` pada identitas Stasiun Klimatologi Jawa Timur di footer diganti dengan aset logo BMKG yang sama.

### File Terkait
- `public/logo_bmkg.png`
- `components/Sidebar.tsx`
- `components/PublicFooter.tsx`
- `CHANGELOG.md`

### Catatan
- Teks branding dan susunan layout dipertahankan; hanya simbol logo yang diganti.
- Logo dirender melalui komponen `next/image` dengan ukuran tetap 36 px pada side panel dan 56 px pada footer.
- `npx tsc --noEmit` dan `npm run build` berhasil tanpa error.
- `npm run lint` selesai tanpa error dengan 4 warning lama di luar cakupan perubahan.

## [Tahap 26] - Normalisasi Delapan Arah Mata Angin - 2026-07-17
### Ditambahkan
- Delapan singkatan arah mata angin Indonesia pada kompas: `U`, `TL`, `T`, `TG`, `S`, `BD`, `B`, dan `BL`.
- Alias normalisasi untuk kode antara 16 arah agar respons BMKG yang lebih rinci tetap dipetakan ke arah utama terdekat.

### Diubah
- Kode Inggris field `wd` dari API BMKG (`N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW`) ditampilkan sebagai nama dan singkatan Bahasa Indonesia.
- Informasi bawah card `Wind Status` memakai format seperti `Timur Laut (TL)`.
- Jarum kompas dinormalisasi ke salah satu dari delapan arah utama agar konsisten dengan label yang ditampilkan.

### File Terkait
- `components/MainContent.tsx`
- `CHANGELOG.md`

### Catatan
- Nilai asli `wd` tetap berasal dari API publik BMKG; frontend hanya melakukan normalisasi untuk penyajian kepada pengguna.
- Kondisi `CALM`, `VARIABLE`, dan nilai yang tidak dikenal tetap memiliki fallback tanpa singkatan arah.
- `npx tsc --noEmit` dan `npm run build` berhasil tanpa error.
- `npm run lint` selesai tanpa error dengan 4 warning lama di luar cakupan perubahan.
- Tampilan delapan label kompas dan format arah lengkap diverifikasi melalui render browser.

## [Tahap 25] - Penyelarasan Card Today's Highlights - 2026-07-17
### Ditambahkan
- Ilustrasi kompas dinamis pada card `Wind Status` yang berputar mengikuti 16 kode arah mata angin dari data BMKG.
- Terjemahan arah mata angin ke Bahasa Indonesia, termasuk kondisi angin tenang, berubah-ubah, dan data tidak tersedia.

### Diubah
- Struktur nilai dan informasi bawah pada empat card highlight diseragamkan agar sejajar secara vertikal.
- Indikator vertikal dekoratif pada card `Humidity` dihapus.
- Penentuan prakiraan hujan memakai nilai numerik agar nilai seperti `0.0` tetap dibaca sebagai cerah.

### File Terkait
- `components/MainContent.tsx`
- `CHANGELOG.md`

### Catatan
- Kompas memakai singkatan Bahasa Indonesia `U`, `T`, `S`, dan `B`, sedangkan arah lengkap ditampilkan di bawah nilai kecepatan angin.
- `npx tsc --noEmit` dan `npm run build` berhasil tanpa error.
- `npm run lint` selesai tanpa error dengan 4 warning lama di luar cakupan perubahan.
- Tampilan landing page diverifikasi melalui render browser pada data BMKG aktual.

## [Tahap 24] - Grafik Curah Hujan dan Rekomendasi Tanam - 2026-07-17
### Ditambahkan
- Komponen reusable `RainfallRecommendationChart` berbasis Recharts untuk menampilkan curah hujan per 10 hari, jumlah hari hujan, batas rule, dan status rekomendasi tanam.
- Tooltip detail, ringkasan periode terbaru, legenda status, serta state loading, data kosong, error, dan aksi coba lagi pada grafik.
- Grafik pada bagian pertama `Today's Highlights` di landing page dan di bawah `Aksi Cepat` pada Dashboard admin.
- Dependency `recharts` versi 3.9.2 sebagai library visualisasi responsif.

### Diubah
- Card `Curah Hujan`, `Wind Status`, `Humidity`, dan `Visibility` disusun menjadi satu baris pada layar desktop setelah grafik.
- Card contoh `Sunrise & Sunset` dan `Air Quality` dihapus dari `Today's Highlights` agar informasi yang tampil berasal dari data yang relevan.

### File Terkait
- `components/RainfallRecommendationChart.tsx`
- `components/MainContent.tsx`
- `app/admin/dashboard/page.tsx`
- `package.json`
- `package-lock.json`
- `CHANGELOG.md`

### Catatan
- Grafik memakai endpoint publik `GET /publik/grafik-curah-hujan?jumlah_periode=12` melalui API client terpusat dan dapat digunakan tanpa autentikasi.
- Warna batang merepresentasikan hasil rekomendasi backend; frontend tidak menghitung atau mengganti keputusan tanam.
- `npx tsc --noEmit` dan `npm run build` berhasil tanpa error.
- `npm run lint` selesai tanpa error dengan 4 warning lama di luar cakupan perubahan.

## [Tahap 23] - Kompatibilitas UI Rule Engine AMH Baru - 2026-07-17
### Ditambahkan
- Form terstruktur untuk lima parameter metodologi AMH: CH minimum, jendela dasarian, total CH alternatif, toggle kriteria HH, dan HH minimum.
- Toggle aksesibel untuk `pakai_kriteria_hari_hujan` serta petunjuk dan satuan pada setiap parameter.
- Aksi `Bandingkan HH` khusus super admin untuk membuat salinan rule baru dengan nilai toggle HH dibalik.

### Diubah
- Tipe TypeScript dan pembentukan payload rule memisahkan parameter numerik dari boolean agar toggle HH tidak dikonversi menjadi `NaN`/`null`.
- Nilai default pembuatan rule diselaraskan dengan backend: 50 mm, 3 dasarian, total alternatif 150 mm, toggle HH aktif, dan minimum 3 HH.
- Tabel rule menampilkan nama parameter dan satuan yang ramah admin, bukan key JSON mentah.
- Modal rule dibuat scrollable agar lima parameter tetap dapat diakses pada layar pendek dan perangkat mobile.

### File Terkait
- `app/admin/rules/page.tsx`
- `CHANGELOG.md`

### Catatan
- `min_hari_hujan_dasarian` tetap dikirim ke backend saat toggle HH nonaktif karena backend mewajibkan struktur parameter lengkap.
- Aksi `Bandingkan HH` membuat record rule baru sehingga evaluasi dengan dan tanpa HH tersimpan pada `rule_id` berbeda dan tidak saling menimpa.
- Halaman publik, agregasi, histori rekomendasi, dan ringkasan AI tidak memerlukan perubahan kontrak.
- `npm run lint -- --max-warnings=10` selesai tanpa error dengan 4 warning lama di luar cakupan perubahan.
- `npm run build` berhasil pada Next.js 16.2.10 tanpa error TypeScript maupun kompilasi.

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
