# MyFarmer Monorepo

MyFarmer adalah sistem informasi curah hujan berbasis AI untuk membantu optimalisasi waktu tanam padi di Kecamatan Karangploso. Repository ini memuat backend Laravel, frontend Next.js, dataset pendukung, serta dokumentasi teknis dalam satu monorepo.

## Struktur repository

| Path | Isi |
|---|---|
| `myfarmer/` | REST API Laravel 10 dan integrasi database MySQL |
| `myfarmer_frontd/` | Aplikasi Next.js untuk landing page publik dan panel admin |
| `data_curah_hujan/` | Dataset contoh/sumber data curah hujan |
| `API_DOCUMENTATION.md` | Kontrak endpoint REST API |
| `DB_DOCUMENTATION.md` | Dokumentasi skema, relasi, dan ERD database |
| `RULE_BASE.md` | Landasan akademis dan cara kerja rule base rekomendasi tanam |

## Prasyarat

- PHP 8.1 atau lebih baru
- Composer
- MySQL
- Node.js 20.9 atau lebih baru
- npm

## Menjalankan backend

```bash
cd myfarmer
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Untuk PowerShell, gunakan `Copy-Item .env.example .env` sebagai pengganti perintah `cp`. Sebelum migrasi, sesuaikan konfigurasi `DB_*` dan `GROQ_API_KEY` di `myfarmer/.env`.

Backend berjalan secara default di `http://localhost:8000`.

## Menjalankan frontend

Buka terminal baru dari root repository:

```bash
cd myfarmer_frontd
npm ci
cp .env.example .env.local
npm run dev
```

Untuk PowerShell, gunakan `Copy-Item .env.example .env.local`. Frontend berjalan secara default di `http://localhost:3000` dan mengakses backend melalui `NEXT_PUBLIC_API_BASE_URL`.

## Pengujian

Backend:

```bash
cd myfarmer
php artisan test
```

Frontend:

```bash
cd myfarmer_frontd
npm run lint
npm run build
```

## Dokumentasi

- [Dokumentasi API](API_DOCUMENTATION.md)
- [Dokumentasi database](DB_DOCUMENTATION.md)
- [Dokumentasi rule base](RULE_BASE.md)
- [Panduan kontribusi](CONTRIBUTING.md)
- [Changelog backend](myfarmer/CHANGELOG.md)
- [Changelog frontend](myfarmer_frontd/CHANGELOG.md)

## Aturan keamanan

Jangan commit `.env`, token API, password database, dump database, log, atau dependency hasil instalasi. Commit hanya file `.env.example` yang berisi placeholder aman.

## Alur kolaborasi singkat

1. Buat branch dari `main`.
2. Kerjakan satu perubahan terfokus dan tambahkan test yang relevan.
3. Perbarui changelog aplikasi yang berubah.
4. Push branch dan buka pull request.
5. Minta review sebelum merge ke `main`.
