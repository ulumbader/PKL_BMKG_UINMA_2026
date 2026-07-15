# Panduan Kontribusi MyFarmer

Terima kasih sudah berkontribusi. Gunakan panduan ini agar perubahan backend, frontend, dan dokumentasi mudah direview oleh tim.

## Persiapan

1. Clone repository dan ikuti langkah instalasi di `README.md`.
2. Pastikan backend dan frontend dapat dijalankan secara lokal.
3. Jangan menggunakan kredensial production pada environment lokal.

## Branch

Selalu buat branch baru dari `main` yang sudah diperbarui:

```bash
git switch main
git pull --ff-only
git switch -c feat/nama-fitur
```

Gunakan awalan berikut:

- `feat/` untuk fitur baru
- `fix/` untuk perbaikan bug
- `docs/` untuk dokumentasi
- `refactor/` untuk restrukturisasi tanpa perubahan perilaku
- `test/` untuk pengujian
- `chore/` untuk konfigurasi dan pemeliharaan

## Commit

Buat commit kecil dan terfokus. Format yang disarankan:

```text
tipe(scope): ringkasan perubahan
```

Contoh:

```text
feat(backend): tambah filter tanggal data iklim
fix(frontend): tangani respons rekomendasi kosong
docs(api): perbarui contoh respons login
```

Jangan commit file environment, token, password, log, dependency, atau hasil build.

## Aturan perubahan

- Backend tetap berupa REST API dan mengikuti format respons yang sudah ditetapkan.
- Jangan mengubah migration yang sudah pernah dijalankan; buat migration baru.
- Frontend harus menggunakan API client terpusat dan environment variable untuk base URL.
- Jangan menambah dependency tanpa alasan yang jelas dan persetujuan tim.
- Perbarui `myfarmer/CHANGELOG.md` dan/atau `myfarmer_frontd/CHANGELOG.md` sesuai area yang berubah.
- Jika kontrak endpoint atau database berubah, perbarui dokumentasi di root repository.

## Verifikasi sebelum pull request

Jalankan pemeriksaan yang sesuai dengan area perubahan:

```bash
# Backend
cd myfarmer
php artisan test

# Frontend
cd ../myfarmer_frontd
npm run lint
npm run build
```

Pastikan juga `git status` tidak menampilkan `.env`, `vendor`, `node_modules`, `.next`, log, cache, atau file lokal lain.

## Pull request

- Jelaskan masalah dan solusi secara ringkas.
- Cantumkan cara menguji perubahan.
- Tambahkan screenshot untuk perubahan antarmuka.
- Kaitkan issue terkait jika tersedia.
- Hindari mencampur refactor besar dengan fitur atau bug fix yang tidak berkaitan.
- Tunggu review dan selesaikan percakapan review sebelum merge.
