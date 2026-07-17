# API Documentation — MyFarmer Backend

Dokumentasi lengkap seluruh endpoint REST API backend MyFarmer.

**Base URL:** `http://localhost:8000/api`
**Format Response:** JSON (standar `{status, message, data}`)
**Autentikasi:** Laravel Sanctum (Bearer Token)

---

## Daftar Isi

1. [Autentikasi (Auth)](#1-autentikasi-auth)
2. [Kelola User Admin (Super Admin)](#2-kelola-user-admin-super-admin)
3. [Stasiun Iklim](#3-stasiun-iklim)
4. [Data Iklim Harian](#4-data-iklim-harian)
5. [Agregasi Dasarian](#5-agregasi-dasarian)
6. [Rule Rekomendasi](#6-rule-rekomendasi)
7. [Evaluasi & Hasil Rekomendasi](#7-evaluasi--hasil-rekomendasi)
8. [Ringkasan AI (Groq)](#8-ringkasan-ai-groq)
9. [Konten Landing Page](#9-konten-landing-page)
10. [Log Import Data](#10-log-import-data)
11. [Audit Log](#11-audit-log)
12. [Endpoint Publik (Landing Page)](#12-endpoint-publik-landing-page)

---

## Format Response Standar

**Sukses:**
```json
{
  "status": "success",
  "message": "Pesan deskriptif",
  "data": { ... }
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Pesan error",
  "errors": { ... }
}
```

---

## 1. Autentikasi (Auth)

### POST `/api/auth/login`

Login admin/super_admin dan dapatkan Sanctum token.

| Field | Middleware | Deskripsi |
|---|---|---|
| Method | `POST` | — |
| Middleware | — (publik) | Tidak butuh token |

**Request Body:**
```json
{
  "email": "superadmin@myfarmer.test",
  "password": "password123"
}
```

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Login berhasil.",
  "data": {
    "user": {
      "id": 1,
      "nama_lengkap": "Super Admin",
      "email": "superadmin@myfarmer.test",
      "nama_role": "super_admin",
      "is_active": true,
      "last_login": "2026-07-05T14:00:00.000000Z"
    },
    "token": "1|abc123tokenstring..."
  }
}
```

**Response Gagal — Kredensial salah (401):**
```json
{
  "status": "error",
  "message": "Email atau password salah."
}
```

**Response Gagal — Akun nonaktif (403):**
```json
{
  "status": "error",
  "message": "Akun Anda telah dinonaktifkan. Hubungi super admin."
}
```

---

### POST `/api/auth/logout`

Logout dan revoke token yang sedang dipakai.

| Field | Nilai |
|---|---|
| Method | `POST` |
| Middleware | `auth:sanctum` |
| Header | `Authorization: Bearer {token}` |

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Logout berhasil.",
  "data": null
}
```

---

## 2. Kelola User Admin (Super Admin)

> Semua endpoint di bawah ini membutuhkan middleware `auth:sanctum` + `role:super_admin`.

### GET `/api/admin/users`

Daftar semua user admin.

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Daftar user berhasil diambil.",
  "data": [
    {
      "id": 1,
      "nama_lengkap": "Super Admin",
      "email": "superadmin@myfarmer.test",
      "nama_role": "super_admin",
      "is_active": true,
      "last_login": "2026-07-05T14:00:00.000000Z",
      "created_at": "2026-07-05T07:00:00.000000Z"
    }
  ]
}
```

---

### POST `/api/admin/users`

Buat akun admin baru.

**Request Body:**
```json
{
  "nama_lengkap": "Admin Baru",
  "email": "adminbaru@myfarmer.test",
  "password": "password123",
  "role_id": 1
}
```

**Response Sukses (201):**
```json
{
  "status": "success",
  "message": "User berhasil dibuat.",
  "data": {
    "id": 2,
    "nama_lengkap": "Admin Baru",
    "email": "adminbaru@myfarmer.test",
    "nama_role": "admin",
    "is_active": true,
    "created_at": "2026-07-05T14:00:00.000000Z"
  }
}
```

---

### PUT `/api/admin/users/{user}`

Update data admin.

**Request Body:**
```json
{
  "nama_lengkap": "Nama Baru",
  "is_active": false
}
```

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "User berhasil diperbarui.",
  "data": {
    "id": 2,
    "nama_lengkap": "Nama Baru",
    "email": "adminbaru@myfarmer.test",
    "nama_role": "admin",
    "is_active": false,
    "last_login": null,
    "updated_at": "2026-07-05T14:01:00.000000Z"
  }
}
```

---

### DELETE `/api/admin/users/{user}`

Nonaktifkan (default) atau hapus admin permanen (`?force=true`).

| Query Param | Deskripsi |
|---|---|
| `force=true` | Hapus permanen (bukan hanya nonaktifkan) |

**Response Sukses — Nonaktifkan (200):**
```json
{
  "status": "success",
  "message": "User berhasil dinonaktifkan.",
  "data": null
}
```

**Response Sukses — Hapus permanen (200):**
```json
{
  "status": "success",
  "message": "User berhasil dihapus permanen.",
  "data": null
}
```

**Response Gagal — Hapus diri sendiri (400):**
```json
{
  "status": "error",
  "message": "Anda tidak bisa menonaktifkan/menghapus akun Anda sendiri."
}
```

---

## 3. Stasiun Iklim

> Endpoint membutuhkan middleware `auth:sanctum` + `role:admin`.

### GET `/api/admin/stasiun`

Mengambil seluruh metadata stasiun iklim tanpa paginasi. Endpoint ini digunakan untuk mengisi pilihan stasiun pada form, filter, dan proses agregasi admin, termasuk ketika tabel data iklim harian masih kosong.

| Field | Nilai |
|---|---|
| Method | `GET` |
| Middleware | `auth:sanctum`, `role:admin` |
| Header | `Authorization: Bearer {token}` |
| Query Parameter | — (tidak ada) |

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Data stasiun berhasil diambil",
  "data": [
    {
      "id": 1,
      "kode_wmo": "96943",
      "nama_stasiun": "Stasiun Klimatologi Jawa Timur",
      "lintang": "-7.90080",
      "bujur": "112.59790",
      "elevasi_meter": 590
    }
  ]
}
```

---

## 4. Data Iklim Harian

> Semua endpoint membutuhkan middleware `auth:sanctum` + `role:admin`.

### GET `/api/admin/data-iklim`

List data iklim harian dengan filter opsional.

| Query Param | Tipe | Deskripsi |
|---|---|---|
| `stasiun_id` | integer | Filter per stasiun |
| `tanggal` | date (Y-m-d) | Filter tanggal spesifik |
| `tanggal_mulai` | date (Y-m-d) | Filter rentang mulai |
| `tanggal_selesai` | date (Y-m-d) | Filter rentang selesai |
| `per_page` | integer | Jumlah per halaman (default 50, max 200) |

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Data iklim harian berhasil diambil.",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "stasiun_id": 1,
        "tanggal": "2026-01-15",
        "curah_hujan_mm": "12.5",
        "kode_status": "normal",
        "sumber_data": "manual",
        "dibuat_oleh": 1,
        "created_at": "2026-07-05T07:00:00.000000Z",
        "stasiun": { "id": 1, "kode_wmo": "96943", "nama_stasiun": "Stasiun Klimatologi Jawa Timur" },
        "dibuat_oleh_user": { "id": 1, "nama_lengkap": "Super Admin" }
      }
    ],
    "total": 1,
    "per_page": 50
  }
}
```

---

### POST `/api/admin/data-iklim`

Input manual satu data iklim harian.

**Request Body:**
```json
{
  "stasiun_id": 1,
  "tanggal": "2026-01-15",
  "curah_hujan_mm": 12.5,
  "kode_status": "normal"
}
```

| Field | Wajib | Keterangan |
|---|---|---|
| `stasiun_id` | Ya | Harus ada di tabel `stasiun_iklim` |
| `tanggal` | Ya | Format Y-m-d, <= hari ini, unique per stasiun |
| `curah_hujan_mm` | Tidak | Nullable, numeric, min:0 |
| `kode_status` | Tidak | `normal`, `tidak_terukur`, `tidak_ada_data` (default: normal) |

**Response Sukses (201):**
```json
{
  "status": "success",
  "message": "Data iklim harian berhasil disimpan.",
  "data": { "id": 1, "stasiun_id": 1, "tanggal": "2026-01-15", "curah_hujan_mm": "12.5", "kode_status": "normal", "sumber_data": "manual", "..." : "..." }
}
```

---

### PUT `/api/admin/data-iklim/{id}`

Update data iklim harian. Semua field opsional (partial update).

**Request Body:**
```json
{
  "curah_hujan_mm": 15.0
}
```

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Data iklim harian berhasil diperbarui.",
  "data": { "..." : "..." }
}
```

---

### DELETE `/api/admin/data-iklim/{id}`

Hapus data iklim harian.

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Data iklim harian berhasil dihapus.",
  "data": null
}
```

---

### POST `/api/admin/data-iklim/import`

Import data iklim harian dari file CSV BMKG.

**Request Body:** `multipart/form-data`

| Field | Wajib | Keterangan |
|---|---|---|
| `file` | Ya | File CSV (mimes: csv, txt; max 5MB) |
| `stasiun_id` | Ya | Harus ada di tabel `stasiun_iklim` |

**Response Sukses (201):**
```json
{
  "status": "success",
  "message": "Import CSV selesai. 365 data berhasil, 5 baris dilewati, 0 gagal.",
  "data": {
    "ringkasan": {
      "sukses": 365,
      "dilewati": 5,
      "gagal": 0
    }
  }
}
```

---

## 5. Agregasi Dasarian

> Semua endpoint membutuhkan middleware `auth:sanctum` + `role:admin`.

### GET `/api/admin/agregasi/periode-tersedia`

Mengambil periode sumber yang tersedia untuk proses agregasi langsung dari
`data_iklim_harian`, serta daftar tahun yang sudah memiliki hasil agregasi.
Endpoint ini tidak berpaginasi karena hanya mengembalikan metadata tahun dan
bulan, bukan seluruh baris data iklim.

| Query Param | Tipe | Deskripsi |
|---|---|---|
| `stasiun_id` | integer | Opsional; batasi periode sumber dan tahun hasil ke satu stasiun |

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Periode agregasi tersedia berhasil diambil.",
  "data": {
    "periode_sumber": [
      {
        "stasiun_id": 1,
        "tahun": 2025,
        "bulan": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      }
    ],
    "tahun_hasil": [2025]
  }
}
```

`periode_sumber` tetap tersedia meskipun tabel `data_iklim_dasarian` masih
kosong. `tahun_hasil` khusus dipakai untuk memfilter tabel hasil agregasi.

---

### GET `/api/admin/agregasi`

List data iklim dasarian (hasil agregasi).

| Query Param | Tipe | Deskripsi |
|---|---|---|
| `stasiun_id` | integer | Filter per stasiun |
| `tahun` | integer | Filter per tahun |
| `bulan` | integer | Filter per bulan |
| `dasarian_ke` | integer | Filter per dasarian (1, 2, 3) |
| `per_page` | integer | Default 50, max 200 |

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Data iklim dasarian berhasil diambil.",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "stasiun_id": 1,
        "tahun": 2026,
        "bulan": 1,
        "dasarian_ke": 1,
        "total_curah_hujan_mm": "120.5",
        "jumlah_hari_hujan": 7,
        "jumlah_hari_valid": 10,
        "jumlah_hari_missing": 0,
        "status_musim": "normal",
        "dihitung_pada": "2026-07-05T14:00:00.000000Z",
        "stasiun": { "id": 1, "kode_wmo": "96943", "nama_stasiun": "Stasiun Klimatologi Jawa Timur" }
      }
    ]
  }
}
```

---

### POST `/api/admin/agregasi/proses`

Trigger proses agregasi.

**Request Body:**
```json
{
  "stasiun_id": 1,
  "tahun": 2026,
  "bulan": 1,
  "dasarian_ke": 1
}
```

| Field | Wajib | Keterangan |
|---|---|---|
| `stasiun_id` | Ya | Harus ada di tabel `stasiun_iklim` |
| `tahun` | Ya | Integer, 1900–2100 |
| `bulan` | Ya | Integer, 1–12 |
| `dasarian_ke` | Tidak | Integer 1–3. Jika kosong, proses ke-3 sekaligus |

Setiap dasarian yang diminta harus memiliki setidaknya satu data harian pada
stasiun dan periode tersebut. Request dibalas `422` dan tidak menulis hasil
apa pun apabila salah satu dasarian tidak memiliki data sumber.

**Response Sukses (201):**
```json
{
  "status": "success",
  "message": "Agregasi dasarian ke-1 bulan 1/2026 berhasil diproses.",
  "data": [ { "..." : "..." } ]
}
```

---

## 6. Rule Rekomendasi

> Semua endpoint membutuhkan middleware `auth:sanctum` + `role:admin`.
> Pembatasan granular: admin hanya ubah `parameter` & `is_active`; super_admin CRUD penuh.

### GET `/api/admin/rules`

List semua rule rekomendasi.

| Query Param | Tipe | Deskripsi |
|---|---|---|
| `is_active` | boolean | Filter berdasarkan status aktif |

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Daftar rule rekomendasi berhasil diambil.",
  "data": [
    {
      "id": 1,
      "nama_rule": "Rule Awal Musim Tanam",
      "deskripsi": "Evaluasi curah hujan dasarian berturut-turut",
      "parameter": {
        "min_curah_hujan_dasarian": 50,
        "min_dasarian_berturut": 3,
        "total_alternatif_mm": 150,
        "pakai_kriteria_hari_hujan": true,
        "min_hari_hujan_dasarian": 3
      },
      "is_active": true,
      "dibuat_oleh": 1,
      "diubah_oleh": 1,
      "updated_at": "2026-07-05T07:00:00.000000Z"
    }
  ]
}
```

---

### GET `/api/admin/rules/{id}`

Detail satu rule.

---

### POST `/api/admin/rules`

Buat rule baru (**super_admin only**, dicek di Form Request authorize).

**Request Body:**
```json
{
  "nama_rule": "Rule Baru",
  "deskripsi": "Deskripsi rule",
  "parameter": {
    "min_curah_hujan_dasarian": 75,
    "min_dasarian_berturut": 3,
    "total_alternatif_mm": 225,
    "pakai_kriteria_hari_hujan": true,
    "min_hari_hujan_dasarian": 3
  },
  "is_active": true
}
```

**Response Gagal — Admin coba buat rule (403):**
```json
{
  "status": "error",
  "message": "This action is unauthorized."
}
```

---

### PUT `/api/admin/rules/{id}`

Update rule rekomendasi.

- **Admin:** hanya boleh ubah `parameter` dan `is_active`
- **Super admin:** boleh ubah semua field

**Request Body (admin):**
```json
{
  "parameter": {
    "min_curah_hujan_dasarian": 60,
    "min_dasarian_berturut": 3,
    "total_alternatif_mm": 180,
    "pakai_kriteria_hari_hujan": false,
    "min_hari_hujan_dasarian": 3
  }
}
```

Semua key di dalam `parameter` wajib dikirim ketika parameter dibuat atau diperbarui:

| Key | Tipe | Fungsi |
|---|---|---|
| `min_curah_hujan_dasarian` | number | Minimum curah hujan setiap dasarian untuk kriteria utama dan dasarian pertama kriteria alternatif |
| `min_dasarian_berturut` | integer | Ukuran jendela dasarian yang dievaluasi |
| `total_alternatif_mm` | number | Minimum total curah hujan seluruh jendela untuk kriteria alternatif |
| `pakai_kriteria_hari_hujan` | boolean | Toggle penguatan kriteria hari hujan Jawa Timur |
| `min_hari_hujan_dasarian` | integer | Minimum jumlah hari hujan pada setiap dasarian jika toggle aktif |

> Untuk membandingkan metodologi dengan dan tanpa kriteria hari hujan, buat dua record rule dengan parameter yang sama dan nilai toggle berbeda. Jangan hanya mengganti toggle pada satu rule karena evaluasi ulang pasangan `dasarian_id` + `rule_id` akan memperbarui hasil lama.

---

### DELETE `/api/admin/rules/{id}`

Hapus rule (**super_admin only**). Ditolak jika rule sudah punya hasil rekomendasi (409).

**Response Gagal — Rule sudah dipakai (409):**
```json
{
  "status": "error",
  "message": "Rule tidak bisa dihapus karena sudah memiliki hasil rekomendasi. Nonaktifkan saja (is_active = false)."
}
```

---

## 7. Evaluasi & Hasil Rekomendasi

> Middleware `auth:sanctum` + `role:admin`.

### GET `/api/admin/rekomendasi`

Histori hasil rekomendasi.

| Query Param | Tipe | Deskripsi |
|---|---|---|
| `dasarian_id` | integer | Filter per dasarian |
| `rule_id` | integer | Filter per rule |
| `status_rekomendasi` | string | `optimal_tanam`, `tunggu`, `tidak_disarankan` |
| `per_page` | integer | Default 50, max 200 |

---

### POST `/api/admin/rekomendasi/evaluasi`

Trigger evaluasi rule engine terhadap satu dasarian.

Rule membaca jendela dasarian secara kronologis sampai periode yang dipilih:

1. **Kriteria utama:** semua dasarian memiliki curah hujan minimal sesuai `min_curah_hujan_dasarian`.
2. **Kriteria alternatif:** dasarian pertama memenuhi minimum, sedikitnya satu dasarian berikutnya berada di bawah minimum, tetapi total seluruh jendela mencapai `total_alternatif_mm`.
3. **Penguatan hari hujan:** jika `pakai_kriteria_hari_hujan = true`, setiap dasarian juga wajib mencapai `min_hari_hujan_dasarian`.

Kriteria hari hujan mengikuti kajian Ulfah dan Sulistya untuk Jawa Timur (`CH >= 50 mm` dan `HH >= 3 hari` per dasarian). Pada proses agregasi, satu hari dihitung sebagai hari hujan jika CH harian `>= 0,5 mm`. Kriteria total alternatif merupakan konfigurasi metodologi proyek berdasarkan arahan pembimbing, bukan kesimpulan utama kajian Ulfah dan Sulistya.

**Request Body:**
```json
{
  "dasarian_id": 1
}
```

**Response Sukses (201):**
```json
{
  "status": "success",
  "message": "1 rule berhasil dievaluasi untuk dasarian ID 1.",
  "data": [
    {
      "id": 1,
      "dasarian_id": 1,
      "rule_id": 1,
      "status_rekomendasi": "tunggu",
      "catatan_teknis": "Rule 'Rule Awal Musim Tanam': OPTIMAL - kriteria alternatif terpenuhi... Detail kronologis: D1 01/2026: CH 80.0mm (CH lulus), HH 3 hari (HH lulus)...",
      "generated_at": "2026-07-05T14:00:00.000000Z"
    }
  ]
}
```

---

## 8. Ringkasan AI (Groq)

> Middleware `auth:sanctum` + `role:admin`.

### GET `/api/admin/ringkasan`

List ringkasan AI.

| Query Param | Tipe | Deskripsi |
|---|---|---|
| `status` | string | `draft` atau `published` |
| `per_page` | integer | Default 15, max 100 |

---

### POST `/api/admin/ringkasan/generate`

Generate ringkasan AI untuk satu hasil rekomendasi (simpan sebagai **draft**).

**Request Body:**
```json
{
  "hasil_rekomendasi_id": 1
}
```

**Response Sukses (201):**
```json
{
  "status": "success",
  "message": "Ringkasan AI berhasil di-generate dengan status draft. Silakan review sebelum publish.",
  "data": {
    "id": 1,
    "hasil_rekomendasi_id": 1,
    "ringkasan_text": "Berdasarkan pantauan curah hujan di wilayah Karangploso...",
    "status": "draft",
    "is_edited_manual": false,
    "generated_at": "2026-07-05T14:00:00.000000Z",
    "published_at": null
  }
}
```

**Response Gagal — Duplikasi (409):**
```json
{
  "status": "error",
  "message": "Ringkasan AI untuk hasil rekomendasi ini sudah ada (ID: 1). Gunakan endpoint update untuk mengedit, atau hapus dulu ringkasan lama.",
  "errors": { "ringkasan_id": 1 }
}
```

---

### PUT `/api/admin/ringkasan/{id}`

Edit teks ringkasan dan/atau publish.

**Request Body — Edit teks:**
```json
{
  "ringkasan_text": "Teks ringkasan yang sudah diedit oleh admin..."
}
```

**Request Body — Publish:**
```json
{
  "status": "published"
}
```

**Request Body — Edit + Publish sekaligus:**
```json
{
  "ringkasan_text": "Teks final yang sudah disetujui...",
  "status": "published"
}
```

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Ringkasan AI berhasil dipublish.",
  "data": {
    "id": 1,
    "ringkasan_text": "Teks final...",
    "status": "published",
    "is_edited_manual": true,
    "published_at": "2026-07-05T14:01:00.000000Z",
    "direview_oleh": 1
  }
}
```

---

### DELETE `/api/admin/ringkasan/{id}`

Hapus ringkasan AI.

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Ringkasan AI berhasil dihapus.",
  "data": null
}
```

**Response Gagal — Tidak ditemukan (404):**
```json
{
  "status": "error",
  "message": "Ringkasan AI tidak ditemukan."
}
```

---

## 9. Konten Landing Page

> Middleware `auth:sanctum` + `role:admin`.

### GET `/api/admin/konten`

List konten landing page admin (semua, termasuk nonaktif).

| Query Param | Tipe | Deskripsi |
|---|---|---|
| `tipe` | string | `pengumuman` atau `tips` |
| `is_active` | boolean | Filter status aktif |
| `per_page` | integer | Default 15 |

---

### GET `/api/admin/konten/{id}`

Detail satu konten.

---

### POST `/api/admin/konten`

Buat konten landing page baru.

**Request Body:**
```json
{
  "judul": "Pengumuman Musim Tanam",
  "isi": "Berdasarkan data curah hujan terkini, musim tanam diperkirakan akan dimulai...",
  "tipe": "pengumuman",
  "is_active": true,
  "urutan_tampil": 1
}
```

| Field | Wajib | Keterangan |
|---|---|---|
| `judul` | Ya | String, max 255 |
| `isi` | Ya | Text, min 10 karakter |
| `tipe` | Ya | `pengumuman` atau `tips` |
| `is_active` | Tidak | Boolean, default true |
| `urutan_tampil` | Tidak | Integer >= 0, default 0 |

**Response Sukses (201):**
```json
{
  "status": "success",
  "message": "Konten landing page berhasil dibuat",
  "data": {
    "id": 1,
    "judul": "Pengumuman Musim Tanam",
    "isi": "Berdasarkan data curah hujan terkini...",
    "tipe": "pengumuman",
    "is_active": true,
    "urutan_tampil": 1,
    "dibuat_oleh": 1,
    "created_at": "2026-07-05T14:00:00.000000Z"
  }
}
```

---

### PUT `/api/admin/konten/{id}`

Update konten. Semua field opsional (partial update).

---

### DELETE `/api/admin/konten/{id}`

Hapus konten.

---

## 10. Log Import Data

> Middleware `auth:sanctum` + `role:admin`. Read-only.

### GET `/api/admin/log-import`

Histori import data BMKG.

| Query Param | Tipe | Deskripsi |
|---|---|---|
| `status` | string | `sukses` atau `gagal` |
| `sumber` | string | Nama sumber data |
| `tanggal_mulai` | date | Filter dari tanggal |
| `tanggal_selesai` | date | Filter sampai tanggal |
| `per_page` | integer | Default 15 |

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Histori import data berhasil diambil",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "sumber": "import_csv",
        "status": "sukses",
        "jumlah_data_masuk": 365,
        "pesan_error": null,
        "waktu_mulai": "2026-07-05T14:00:00.000000Z",
        "waktu_selesai": "2026-07-05T14:00:05.000000Z",
        "triggered_by": 1,
        "triggered_by_user": { "id": 1, "nama_lengkap": "Super Admin" }
      }
    ]
  }
}
```

---

## 11. Audit Log

> Middleware `auth:sanctum` + `role:super_admin`. Read-only.

### GET `/api/admin/audit-log`

Jejak aktivitas admin (otomatis dicatat oleh Observer).

| Query Param | Tipe | Deskripsi |
|---|---|---|
| `user_id` | integer | Filter per user |
| `tabel_terkait` | string | Nama tabel (misal: `data_iklim_harian`) |
| `aksi` | string | `created`, `updated`, `deleted` |
| `tanggal_mulai` | date | Filter dari tanggal |
| `tanggal_selesai` | date | Filter sampai tanggal |
| `per_page` | integer | Default 20 |

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Data audit log berhasil diambil",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "user_id": 1,
        "aksi": "created",
        "tabel_terkait": "data_iklim_harian",
        "id_terkait": 5,
        "detail": {
          "new": {
            "stasiun_id": 1,
            "tanggal": "2026-01-15",
            "curah_hujan_mm": 12.5,
            "kode_status": "normal"
          }
        },
        "ip_address": "127.0.0.1",
        "created_at": "2026-07-05T14:00:00.000000Z",
        "user": { "id": 1, "nama_lengkap": "Super Admin", "email": "superadmin@myfarmer.test" }
      }
    ]
  }
}
```

---

## 12. Endpoint Publik (Landing Page)

> **TANPA middleware auth.** Hanya method GET. Siapa saja bisa mengakses.
>
> Prakiraan cuaca real-time tidak disediakan oleh backend. Landing page mengambil data tersebut langsung dari API publik BMKG.

### GET `/api/publik/cuaca-terkini`

Data curah hujan dasarian paling baru untuk stasiun default.

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Data cuaca terkini berhasil diambil.",
  "data": {
    "periode": {
      "tahun": 2026,
      "bulan": 1,
      "dasarian_ke": 1
    },
    "curah_hujan": {
      "total_mm": "120.5",
      "hari_hujan": 7
    },
    "status_musim": "normal",
    "stasiun": {
      "nama": "Stasiun Klimatologi Jawa Timur",
      "kode_wmo": "96943"
    }
  }
}
```

**Response — Belum ada data (200):**
```json
{
  "status": "success",
  "message": "Belum ada data curah hujan dasarian.",
  "data": null
}
```

---

### GET `/api/publik/rekomendasi-terkini`

Hasil rekomendasi tanam paling baru.

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Rekomendasi terkini berhasil diambil.",
  "data": {
    "status_rekomendasi": "optimal_tanam",
    "label_rekomendasi": "Waktu yang baik untuk menanam padi",
    "tanggal_evaluasi": "2026-07-05T14:00:00.000000Z",
    "rule": { "nama": "Rule Awal Musim Tanam" },
    "dasarian": { "..." : "..." }
  }
}
```

| `status_rekomendasi` | `label_rekomendasi` (terjemahan awam) |
|---|---|
| `optimal_tanam` | "Waktu yang baik untuk menanam padi" |
| `tunggu` | "Belum waktunya, pantau terus cuaca" |
| `tidak_disarankan` | "Belum disarankan untuk menanam" |

---

### GET `/api/publik/ringkasan-terkini`

Ringkasan AI terbaru yang sudah **published** (draft tidak ditampilkan).

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Ringkasan AI terkini berhasil diambil.",
  "data": {
    "ringkasan": "Berdasarkan pantauan curah hujan di Kec. Karangploso...",
    "published_at": "2026-07-05T14:01:00.000000Z",
    "rekomendasi": { "..." : "..." }
  }
}
```

---

### GET `/api/publik/konten`

Daftar konten landing page yang aktif (`is_active = true`), diurutkan `urutan_tampil` ascending.

**Response Sukses (200):**
```json
{
  "status": "success",
  "message": "Konten landing page berhasil diambil.",
  "data": [
    {
      "judul": "Tips Menanam Padi",
      "isi": "Pastikan curah hujan cukup sebelum memulai tanam...",
      "tipe": "tips"
    }
  ]
}
```

---

## Ringkasan Seluruh Endpoint

| # | Method | Path | Middleware | Fungsi |
|---|---|---|---|---|
| 1 | POST | `/api/auth/login` | — | Login |
| 2 | POST | `/api/auth/logout` | `auth:sanctum` | Logout |
| 3 | GET | `/api/admin/users` | `auth:sanctum`, `role:super_admin` | List users |
| 4 | POST | `/api/admin/users` | `auth:sanctum`, `role:super_admin` | Buat user |
| 5 | PUT | `/api/admin/users/{user}` | `auth:sanctum`, `role:super_admin` | Update user |
| 6 | DELETE | `/api/admin/users/{user}` | `auth:sanctum`, `role:super_admin` | Hapus/nonaktifkan user |
| 7 | GET | `/api/admin/stasiun` | `auth:sanctum`, `role:admin` | List seluruh stasiun iklim |
| 8 | GET | `/api/admin/data-iklim` | `auth:sanctum`, `role:admin` | List data iklim |
| 9 | POST | `/api/admin/data-iklim` | `auth:sanctum`, `role:admin` | Input data manual |
| 10 | PUT | `/api/admin/data-iklim/{id}` | `auth:sanctum`, `role:admin` | Update data iklim |
| 11 | DELETE | `/api/admin/data-iklim/{id}` | `auth:sanctum`, `role:admin` | Hapus data iklim |
| 12 | POST | `/api/admin/data-iklim/import` | `auth:sanctum`, `role:admin` | Import CSV |
| 13 | GET | `/api/admin/agregasi/periode-tersedia` | `auth:sanctum`, `role:admin` | Metadata periode agregasi tersedia |
| 14 | GET | `/api/admin/agregasi` | `auth:sanctum`, `role:admin` | List dasarian |
| 15 | POST | `/api/admin/agregasi/proses` | `auth:sanctum`, `role:admin` | Trigger agregasi |
| 16 | GET | `/api/admin/rules` | `auth:sanctum`, `role:admin` | List rule |
| 17 | GET | `/api/admin/rules/{id}` | `auth:sanctum`, `role:admin` | Detail rule |
| 18 | POST | `/api/admin/rules` | `auth:sanctum`, `role:admin` | Buat rule (super_admin) |
| 19 | PUT | `/api/admin/rules/{id}` | `auth:sanctum`, `role:admin` | Update rule |
| 20 | DELETE | `/api/admin/rules/{id}` | `auth:sanctum`, `role:admin` | Hapus rule (super_admin) |
| 21 | GET | `/api/admin/rekomendasi` | `auth:sanctum`, `role:admin` | Histori rekomendasi |
| 22 | POST | `/api/admin/rekomendasi/evaluasi` | `auth:sanctum`, `role:admin` | Evaluasi rule engine |
| 23 | GET | `/api/admin/ringkasan` | `auth:sanctum`, `role:admin` | List ringkasan AI |
| 24 | POST | `/api/admin/ringkasan/generate` | `auth:sanctum`, `role:admin` | Generate ringkasan |
| 25 | PUT | `/api/admin/ringkasan/{id}` | `auth:sanctum`, `role:admin` | Edit/publish ringkasan |
| 26 | DELETE | `/api/admin/ringkasan/{id}` | `auth:sanctum`, `role:admin` | Hapus ringkasan |
| 27 | GET | `/api/admin/konten` | `auth:sanctum`, `role:admin` | List konten |
| 28 | GET | `/api/admin/konten/{id}` | `auth:sanctum`, `role:admin` | Detail konten |
| 29 | POST | `/api/admin/konten` | `auth:sanctum`, `role:admin` | Buat konten |
| 30 | PUT | `/api/admin/konten/{id}` | `auth:sanctum`, `role:admin` | Update konten |
| 31 | DELETE | `/api/admin/konten/{id}` | `auth:sanctum`, `role:admin` | Hapus konten |
| 32 | GET | `/api/admin/log-import` | `auth:sanctum`, `role:admin` | Histori import |
| 33 | GET | `/api/admin/audit-log` | `auth:sanctum`, `role:super_admin` | Audit log |
| 34 | GET | `/api/publik/cuaca-terkini` | — | Cuaca terkini (dasarian) |
| 35 | GET | `/api/publik/rekomendasi-terkini` | — | Rekomendasi terkini |
| 36 | GET | `/api/publik/ringkasan-terkini` | — | Ringkasan AI terkini |
| 37 | GET | `/api/publik/konten` | — | Konten landing page |

**Total: 37 endpoint**
