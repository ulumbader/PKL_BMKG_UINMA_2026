<?php

use App\Http\Controllers\Api\AggregationController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DataIklimHarianController;
use App\Http\Controllers\Api\KontenLandingPageController;
use App\Http\Controllers\Api\LogImportDataController;
use App\Http\Controllers\Api\PrakiraanCuacaController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\RingkasanAiController;
use App\Http\Controllers\Api\RuleRekomendasiController;
use App\Http\Controllers\Api\StasiunIklimController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Backend MyFarmer — REST API murni.
| Semua route di sini otomatis mendapat prefix '/api'.
|
| Struktur:
|   - /api/auth/*              → login/logout (publik untuk login, auth untuk logout)
|   - /api/admin/users/*       → kelola user admin (super_admin only)
|   - /api/admin/data-iklim/*  → CRUD data iklim harian + import CSV (admin)
|   - /api/admin/agregasi/*    → agregasi dasarian + lihat hasil (admin)
|   - /api/admin/rules/*       → CRUD rule rekomendasi (admin + super_admin, pembatasan di controller)
|   - /api/admin/rekomendasi/* → evaluasi rule engine + histori hasil (admin)
|   - /api/admin/ringkasan/*   → generate, review, publish ringkasan AI (admin)
|   - /api/admin/konten/*      → CRUD konten landing page (admin)
|   - /api/admin/log-import/*  → histori import data BMKG (admin, read-only)
|   - /api/admin/audit-log/*   → audit log aktivitas admin (super_admin, read-only)
|   - /api/admin/prakiraan-cuaca/* → fetch prakiraan cuaca dari API BMKG (admin)
|   - /api/publik/*            → endpoint publik landing page (TANPA auth, GET only)
|
*/

// ============================================================================
// AUTH — Login & Logout
// ============================================================================
Route::prefix('auth')->group(function () {
    // Login — tanpa middleware auth (endpoint publik)
    Route::post('/login', [AuthController::class, 'login']);

    // Logout — wajib autentikasi
    Route::post('/logout', [AuthController::class, 'logout'])
        ->middleware('auth:sanctum');
});

// ============================================================================
// SUPER ADMIN — Kelola User Admin
// ============================================================================
Route::middleware(['auth:sanctum', 'role:super_admin'])->group(function () {
    Route::prefix('admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });
});

// ============================================================================
// ADMIN — Daftar Stasiun Iklim (read-only)
// ============================================================================
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::prefix('admin')->group(function () {
        Route::get('/stasiun', [StasiunIklimController::class, 'index']);
    });
});

// ============================================================================
// ADMIN — CRUD Data Iklim Harian & Import CSV
// ============================================================================
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::prefix('admin/data-iklim')->group(function () {
        Route::get('/', [DataIklimHarianController::class, 'index']);
        Route::post('/', [DataIklimHarianController::class, 'store']);
        Route::put('/{data_iklim_harian}', [DataIklimHarianController::class, 'update']);
        Route::delete('/{data_iklim_harian}', [DataIklimHarianController::class, 'destroy']);

        // Import CSV dari file yang didownload manual dari Data Online BMKG
        Route::post('/import', [DataIklimHarianController::class, 'importCsv']);
    });
});

// ============================================================================
// ADMIN — Agregasi Dasarian
// ============================================================================
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::prefix('admin/agregasi')->group(function () {
        Route::get('/periode-tersedia', [AggregationController::class, 'periodeTersedia']);
        Route::get('/', [AggregationController::class, 'index']);
        Route::post('/proses', [AggregationController::class, 'proses']);
    });
});

// ============================================================================
// ADMIN — CRUD Rule Rekomendasi
// (Middleware role:admin, tapi pembatasan granular per field di controller:
//   - admin: hanya ubah parameter & is_active
//   - super_admin: CRUD penuh termasuk buat & hapus rule)
// ============================================================================
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::prefix('admin/rules')->group(function () {
        Route::get('/', [RuleRekomendasiController::class, 'index']);
        Route::get('/{rule_rekomendasi}', [RuleRekomendasiController::class, 'show']);
        Route::post('/', [RuleRekomendasiController::class, 'store']);
        Route::put('/{rule_rekomendasi}', [RuleRekomendasiController::class, 'update']);
        Route::delete('/{rule_rekomendasi}', [RuleRekomendasiController::class, 'destroy']);
    });
});

// ============================================================================
// ADMIN — Evaluasi Rule Engine & Histori Hasil Rekomendasi
// ============================================================================
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::prefix('admin/rekomendasi')->group(function () {
        Route::get('/', [RuleRekomendasiController::class, 'hasilRekomendasi']);
        Route::post('/evaluasi', [RuleRekomendasiController::class, 'evaluasi']);
    });
});

// ============================================================================
// ADMIN — Ringkasan AI
// (Generate → draft → review manual admin → publish)
// ============================================================================
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::prefix('admin/ringkasan')->group(function () {
        Route::get('/', [RingkasanAiController::class, 'index']);
        Route::post('/generate', [RingkasanAiController::class, 'generate']);
        Route::put('/{ringkasan_ai}', [RingkasanAiController::class, 'updateAndPublish']);
        Route::delete('/{ringkasan_ai}', [RingkasanAiController::class, 'destroy']);
    });
});

// ============================================================================
// ADMIN — CRUD Konten Landing Page (pengumuman/tips)
// ============================================================================
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::prefix('admin/konten')->group(function () {
        Route::get('/', [KontenLandingPageController::class, 'index']);
        Route::get('/{konten_landing_page}', [KontenLandingPageController::class, 'show']);
        Route::post('/', [KontenLandingPageController::class, 'store']);
        Route::put('/{konten_landing_page}', [KontenLandingPageController::class, 'update']);
        Route::delete('/{konten_landing_page}', [KontenLandingPageController::class, 'destroy']);
    });
});

// ============================================================================
// ADMIN — Histori Import Data BMKG (read-only)
// ============================================================================
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::prefix('admin/log-import')->group(function () {
        Route::get('/', [LogImportDataController::class, 'index']);
    });
});

// ============================================================================
// SUPER ADMIN — Audit Log (read-only, hanya super_admin)
// ============================================================================
Route::middleware(['auth:sanctum', 'role:super_admin'])->group(function () {
    Route::prefix('admin/audit-log')->group(function () {
        Route::get('/', [AuditLogController::class, 'index']);
    });
});

// ============================================================================
// ADMIN — Fetch Prakiraan Cuaca Real-Time dari API BMKG
// (Data ini TERPISAH dari data_iklim_harian dan TIDAK dipakai oleh rule engine)
// ============================================================================
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::prefix('admin/prakiraan-cuaca')->group(function () {
        Route::post('/fetch', [PrakiraanCuacaController::class, 'fetch']);
    });
});

// ============================================================================
// PUBLIK — Landing Page Petani (TANPA auth, GET only — Golden Rule #7)
// ============================================================================
Route::prefix('publik')->group(function () {
    Route::get('/cuaca-terkini', [PublicController::class, 'cuacaTerkini']);
    Route::get('/rekomendasi-terkini', [PublicController::class, 'rekomendasiTerkini']);
    Route::get('/ringkasan-terkini', [PublicController::class, 'ringkasanTerkini']);
    Route::get('/konten', [PublicController::class, 'kontenAktif']);
    Route::get('/prakiraan-cuaca', [PublicController::class, 'cuacaRealtime']);
});
