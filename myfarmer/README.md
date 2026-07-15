# MyFarmer Backend

REST API MyFarmer berbasis Laravel 10 dan MySQL. Backend menangani autentikasi admin, data iklim, agregasi dasarian, rule rekomendasi, ringkasan AI, konten publik, serta audit log.

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Sesuaikan koneksi database dan API key di `.env`. Dokumentasi endpoint tersedia di [`../API_DOCUMENTATION.md`](../API_DOCUMENTATION.md), sedangkan dokumentasi database tersedia di [`../DB_DOCUMENTATION.md`](../DB_DOCUMENTATION.md).

## Pengujian

```bash
php artisan test
```

Jangan mengubah migration yang sudah pernah dijalankan. Buat migration baru untuk setiap perubahan skema.
