# MyFarmer Frontend

Aplikasi Next.js untuk landing page publik dan panel administrasi MyFarmer.

## Setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Pastikan backend berjalan dan `NEXT_PUBLIC_API_BASE_URL` di `.env.local` menunjuk ke endpoint API yang benar. Dokumentasi kontrak API tersedia di [`../API_DOCUMENTATION.md`](../API_DOCUMENTATION.md).

## Verifikasi

```bash
npm run lint
npm run build
```

Seluruh request backend harus menggunakan API client terpusat dan base URL dari environment variable.
