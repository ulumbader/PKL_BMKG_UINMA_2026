<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\EvaluasiRuleRequest;
use App\Http\Requests\Admin\StoreRuleRekomendasiRequest;
use App\Http\Requests\Admin\UpdateRuleRekomendasiRequest;
use App\Models\HasilRekomendasi;
use App\Models\RuleRekomendasi;
use App\Services\RuleEngineService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RuleRekomendasiController extends Controller
{
    use ApiResponse;

    // =========================================================================
    // CRUD Rule Rekomendasi
    // =========================================================================

    /**
     * List semua rule rekomendasi.
     */
    public function index(Request $request): JsonResponse
    {
        $query = RuleRekomendasi::with(['dibuatOleh:id,nama_lengkap', 'diubahOleh:id,nama_lengkap']);

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $rules = $query->orderBy('updated_at', 'desc')->get();

        return $this->successResponse($rules, 'Daftar rule rekomendasi berhasil diambil.');
    }

    /**
     * Lihat detail satu rule.
     */
    public function show(int $ruleRekomendasi): JsonResponse
    {
        $rule = RuleRekomendasi::with(['dibuatOleh:id,nama_lengkap', 'diubahOleh:id,nama_lengkap'])
            ->find($ruleRekomendasi);

        if (!$rule) {
            return $this->errorResponse('Rule rekomendasi tidak ditemukan.', null, 404);
        }

        return $this->successResponse($rule, 'Detail rule rekomendasi berhasil diambil.');
    }

    /**
     * Buat rule rekomendasi baru.
     *
     * HANYA super_admin yang boleh membuat rule baru.
     * Pengecekan dilakukan di StoreRuleRekomendasiRequest::authorize().
     */
    public function store(StoreRuleRekomendasiRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $rule = RuleRekomendasi::create([
            'nama_rule'   => $validated['nama_rule'],
            'deskripsi'   => $validated['deskripsi'] ?? null,
            'parameter'   => $validated['parameter'],
            'is_active'   => $validated['is_active'] ?? true,
            'dibuat_oleh' => $request->user()->id,
            'diubah_oleh' => $request->user()->id,
        ]);

        $rule->load(['dibuatOleh:id,nama_lengkap', 'diubahOleh:id,nama_lengkap']);

        return $this->successResponse($rule, 'Rule rekomendasi berhasil dibuat.', 201);
    }

    /**
     * Update rule rekomendasi.
     *
     * Pembatasan per role (defence in depth, bukan hanya middleware):
     *   - admin: hanya boleh mengubah 'parameter' dan 'is_active'
     *   - super_admin: boleh mengubah semua field (nama_rule, deskripsi, parameter, is_active)
     */
    public function update(UpdateRuleRekomendasiRequest $request, int $ruleRekomendasi): JsonResponse
    {
        $rule = RuleRekomendasi::find($ruleRekomendasi);

        if (!$rule) {
            return $this->errorResponse('Rule rekomendasi tidak ditemukan.', null, 404);
        }

        $validated = $request->validated();
        $user = $request->user();

        // Pembatasan field berdasarkan role
        if (!$user->hasRole('super_admin')) {
            // Admin biasa: hanya boleh ubah parameter dan is_active
            $allowedFields = ['parameter', 'is_active'];
            $attemptedFields = array_keys($validated);
            $forbiddenFields = array_diff($attemptedFields, $allowedFields);

            if (!empty($forbiddenFields)) {
                return $this->errorResponse(
                    'Admin hanya boleh mengubah field parameter dan is_active.',
                    ['forbidden_fields' => array_values($forbiddenFields)],
                    403
                );
            }
        }

        // Tambahkan diubah_oleh
        $validated['diubah_oleh'] = $user->id;

        $rule->update($validated);
        $rule->load(['dibuatOleh:id,nama_lengkap', 'diubahOleh:id,nama_lengkap']);

        return $this->successResponse($rule, 'Rule rekomendasi berhasil diperbarui.');
    }

    /**
     * Hapus rule rekomendasi.
     *
     * HANYA super_admin yang boleh menghapus rule.
     */
    public function destroy(int $ruleRekomendasi): JsonResponse
    {
        $user = request()->user();

        if (!$user->hasRole('super_admin')) {
            return $this->errorResponse('Hanya super_admin yang boleh menghapus rule.', null, 403);
        }

        $rule = RuleRekomendasi::find($ruleRekomendasi);

        if (!$rule) {
            return $this->errorResponse('Rule rekomendasi tidak ditemukan.', null, 404);
        }

        // Cek apakah rule sudah pernah dipakai di hasil_rekomendasi
        if ($rule->hasilRekomendasi()->exists()) {
            return $this->errorResponse(
                'Rule tidak bisa dihapus karena sudah memiliki hasil rekomendasi. Nonaktifkan saja (is_active = false).',
                null,
                409
            );
        }

        $rule->delete();

        return $this->successResponse(null, 'Rule rekomendasi berhasil dihapus.');
    }

    // =========================================================================
    // Evaluasi Rule Engine & Histori Hasil
    // =========================================================================

    /**
     * Trigger evaluasi rule engine terhadap satu dasarian.
     */
    public function evaluasi(EvaluasiRuleRequest $request, RuleEngineService $ruleEngineService): JsonResponse
    {
        $dasarianId = (int) $request->input('dasarian_id');

        $hasil = $ruleEngineService->evaluate($dasarianId);

        if (empty($hasil)) {
            return $this->successResponse([], 'Tidak ada rule aktif untuk dievaluasi.');
        }

        $jumlahRule = count($hasil);
        $message = "{$jumlahRule} rule berhasil dievaluasi untuk dasarian ID {$dasarianId}.";

        return $this->successResponse($hasil, $message, 201);
    }

    /**
     * Histori hasil rekomendasi dengan filter opsional.
     *
     * Query params:
     *   - dasarian_id         : filter per dasarian
     *   - rule_id             : filter per rule
     *   - status_rekomendasi  : filter per status (optimal_tanam, tunggu, tidak_disarankan)
     *   - per_page            : jumlah per halaman (default 50, max 200)
     */
    public function hasilRekomendasi(Request $request): JsonResponse
    {
        $query = HasilRekomendasi::with([
            'dasarian:id,stasiun_id,tahun,bulan,dasarian_ke,total_curah_hujan_mm,status_musim',
            'dasarian.stasiun:id,kode_wmo,nama_stasiun',
            'rule:id,nama_rule,is_active',
        ]);

        if ($request->filled('dasarian_id')) {
            $query->where('dasarian_id', $request->input('dasarian_id'));
        }

        if ($request->filled('rule_id')) {
            $query->where('rule_id', $request->input('rule_id'));
        }

        if ($request->filled('status_rekomendasi')) {
            $query->where('status_rekomendasi', $request->input('status_rekomendasi'));
        }

        $query->orderBy('generated_at', 'desc');

        $perPage = min((int) $request->input('per_page', 50), 200);
        $data = $query->paginate($perPage);

        return $this->successResponse($data, 'Histori hasil rekomendasi berhasil diambil.');
    }
}
