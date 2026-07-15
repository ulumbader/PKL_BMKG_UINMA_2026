<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GenerateRingkasanRequest;
use App\Http\Requests\Admin\UpdateRingkasanRequest;
use App\Models\HasilRekomendasi;
use App\Models\RingkasanAi;
use App\Services\GroqService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RingkasanAiController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = RingkasanAi::with([
            'hasilRekomendasi:id,dasarian_id,rule_id,status_rekomendasi,generated_at',
            'hasilRekomendasi.dasarian:id,stasiun_id,tahun,bulan,dasarian_ke,total_curah_hujan_mm,status_musim',
            'hasilRekomendasi.dasarian.stasiun:id,nama_stasiun',
            'hasilRekomendasi.rule:id,nama_rule',
            'direviewOleh:id,nama_lengkap',
        ]);

        if ($request->filled('status')) {
            $status = $request->input('status');
            if (in_array($status, ['draft', 'published'])) {
                $query->where('status', $status);
            }
        }

        $query->orderBy('status', 'asc')
            ->orderBy('generated_at', 'desc');

        $perPage = min((int) $request->input('per_page', 15), 100);
        $data = $query->paginate($perPage);

        return $this->successResponse($data, 'Daftar ringkasan AI berhasil diambil.');
    }

    public function generate(GenerateRingkasanRequest $request, GroqService $groqService): JsonResponse
    {
        $hasilRekomendasiId = (int) $request->input('hasil_rekomendasi_id');

        $hasilRekomendasi = HasilRekomendasi::with([
            'dasarian:id,stasiun_id,tahun,bulan,dasarian_ke,total_curah_hujan_mm,jumlah_hari_hujan,jumlah_hari_valid,jumlah_hari_missing,status_musim',
            'dasarian.stasiun:id,nama_stasiun',
            'rule:id,nama_rule',
        ])->find($hasilRekomendasiId);

        if (!$hasilRekomendasi) {
            return $this->errorResponse('Hasil rekomendasi tidak ditemukan.', null, 404);
        }

        $existing = RingkasanAi::where('hasil_rekomendasi_id', $hasilRekomendasiId)->first();
        if ($existing) {
            return $this->errorResponse(
                'Ringkasan AI untuk hasil rekomendasi ini sudah ada (ID: ' . $existing->id . '). '
                . 'Gunakan endpoint update untuk mengedit, atau hapus dulu ringkasan lama.',
                ['ringkasan_id' => $existing->id],
                409
            );
        }

        $dataDasarian = [
            'tahun' => $hasilRekomendasi->dasarian->tahun,
            'bulan' => $hasilRekomendasi->dasarian->bulan,
            'dasarian_ke' => $hasilRekomendasi->dasarian->dasarian_ke,
            'total_curah_hujan_mm' => $hasilRekomendasi->dasarian->total_curah_hujan_mm,
            'jumlah_hari_hujan' => $hasilRekomendasi->dasarian->jumlah_hari_hujan,
            'jumlah_hari_valid' => $hasilRekomendasi->dasarian->jumlah_hari_valid,
            'status_musim' => $hasilRekomendasi->dasarian->status_musim,
            'nama_stasiun' => $hasilRekomendasi->dasarian->stasiun->nama_stasiun ?? 'Stasiun Iklim',
        ];

        $dataRekomendasi = [
            'status_rekomendasi' => $hasilRekomendasi->status_rekomendasi,
            'catatan_teknis' => $hasilRekomendasi->catatan_teknis,
            'nama_rule' => $hasilRekomendasi->rule->nama_rule ?? '-',
        ];

        $ringkasanText = $groqService->generateRingkasan($dataDasarian, $dataRekomendasi);

        $ringkasan = RingkasanAi::create([
            'hasil_rekomendasi_id' => $hasilRekomendasiId,
            'ringkasan_text' => $ringkasanText,
            'status' => 'draft',
            'is_edited_manual' => false,
            'direview_oleh' => null,
            'generated_at' => Carbon::now(),
            'published_at' => null,
        ]);

        $ringkasan->load([
            'hasilRekomendasi:id,dasarian_id,rule_id,status_rekomendasi',
            'hasilRekomendasi.dasarian:id,tahun,bulan,dasarian_ke,total_curah_hujan_mm',
            'hasilRekomendasi.rule:id,nama_rule',
        ]);

        return $this->successResponse(
            $ringkasan,
            'Ringkasan AI berhasil di-generate dengan status draft. Silakan review sebelum publish.',
            201
        );
    }

    public function updateAndPublish(UpdateRingkasanRequest $request, int $ringkasan_ai): JsonResponse
    {
        $ringkasan = RingkasanAi::find($ringkasan_ai);

        if (!$ringkasan) {
            return $this->errorResponse('Ringkasan AI tidak ditemukan.', null, 404);
        }

        $validated = $request->validated();
        $user = $request->user();

        if (isset($validated['ringkasan_text'])) {
            $ringkasan->ringkasan_text = $validated['ringkasan_text'];
            $ringkasan->is_edited_manual = true;
        }

        if (isset($validated['status'])) {
            $ringkasan->status = $validated['status'];

            if ($validated['status'] === 'published') {
                $ringkasan->published_at = Carbon::now();
                $ringkasan->direview_oleh = $user->id;
            } elseif ($validated['status'] === 'draft') {
                $ringkasan->published_at = null;
            }
        }

        $ringkasan->save();

        $ringkasan->load([
            'hasilRekomendasi:id,dasarian_id,rule_id,status_rekomendasi',
            'hasilRekomendasi.dasarian:id,tahun,bulan,dasarian_ke,total_curah_hujan_mm',
            'hasilRekomendasi.rule:id,nama_rule',
            'direviewOleh:id,nama_lengkap',
        ]);

        $actionMessage = $ringkasan->status === 'published'
            ? 'Ringkasan AI berhasil dipublish.'
            : 'Ringkasan AI berhasil diperbarui.';

        return $this->successResponse($ringkasan, $actionMessage);
    }

    public function destroy(int $ringkasan_ai): JsonResponse
    {
        $ringkasan = RingkasanAi::find($ringkasan_ai);

        if (!$ringkasan) {
            return $this->errorResponse('Ringkasan AI tidak ditemukan.', null, 404);
        }

        $ringkasan->delete();

        return $this->successResponse(null, 'Ringkasan AI berhasil dihapus.');
    }
}
