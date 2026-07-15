<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ImportCsvRequest;
use App\Http\Requests\Admin\StoreDataIklimHarianRequest;
use App\Http\Requests\Admin\UpdateDataIklimHarianRequest;
use App\Models\DataIklimHarian;
use App\Services\CsvImportService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DataIklimHarianController extends Controller
{
    use ApiResponse;

    /**
     * List data iklim harian dengan filter opsional.
     *
     * Query params:
     *   - stasiun_id     : filter per stasiun
     *   - tanggal         : filter tanggal spesifik (Y-m-d)
     *   - tanggal_mulai   : filter rentang mulai (Y-m-d)
     *   - tanggal_selesai : filter rentang selesai (Y-m-d)
     *   - per_page        : jumlah per halaman (default 50, max 200)
     */
    public function index(Request $request): JsonResponse
    {
        $query = DataIklimHarian::with(['stasiun:id,kode_wmo,nama_stasiun', 'dibuatOleh:id,nama_lengkap']);

        // Filter per stasiun
        if ($request->filled('stasiun_id')) {
            $query->where('stasiun_id', $request->input('stasiun_id'));
        }

        // Filter tanggal spesifik
        if ($request->filled('tanggal')) {
            $query->where('tanggal', $request->input('tanggal'));
        }

        // Filter rentang tanggal
        if ($request->filled('tanggal_mulai') && $request->filled('tanggal_selesai')) {
            $query->whereBetween('tanggal', [
                $request->input('tanggal_mulai'),
                $request->input('tanggal_selesai'),
            ]);
        } else {
            if ($request->filled('tanggal_mulai')) {
                $query->where('tanggal', '>=', $request->input('tanggal_mulai'));
            }

            if ($request->filled('tanggal_selesai')) {
                $query->where('tanggal', '<=', $request->input('tanggal_selesai'));
            }
        }

        // Urut dari terbaru
        $query->orderBy('tanggal', 'desc');

        // Pagination
        $perPage = min((int) $request->input('per_page', 50), 200);
        $data = $query->paginate($perPage);

        return $this->successResponse($data, 'Data iklim harian berhasil diambil.');
    }

    /**
     * Simpan satu data iklim harian (input manual admin).
     */
    public function store(StoreDataIklimHarianRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Jika kode_status bukan 'normal', curah_hujan_mm harus null
        if (isset($validated['kode_status']) && $validated['kode_status'] !== 'normal') {
            $validated['curah_hujan_mm'] = null;
        }

        $data = DataIklimHarian::create([
            'stasiun_id'     => $validated['stasiun_id'],
            'tanggal'        => $validated['tanggal'],
            'curah_hujan_mm' => $validated['curah_hujan_mm'] ?? null,
            'kode_status'    => $validated['kode_status'] ?? 'normal',
            'sumber_data'    => 'manual',
            'dibuat_oleh'    => $request->user()->id,
        ]);

        $data->load(['stasiun:id,kode_wmo,nama_stasiun', 'dibuatOleh:id,nama_lengkap']);

        return $this->successResponse($data, 'Data iklim harian berhasil disimpan.', 201);
    }

    /**
     * Update data iklim harian.
     */
    public function update(UpdateDataIklimHarianRequest $request, int $dataIklimHarian): JsonResponse
    {
        $data = DataIklimHarian::find($dataIklimHarian);

        if (!$data) {
            return $this->errorResponse('Data iklim harian tidak ditemukan.', null, 404);
        }

        $validated = $request->validated();

        // Jika kode_status bukan 'normal', curah_hujan_mm harus null
        if (isset($validated['kode_status']) && $validated['kode_status'] !== 'normal') {
            $validated['curah_hujan_mm'] = null;
        }

        $data->update($validated);
        $data->load(['stasiun:id,kode_wmo,nama_stasiun', 'dibuatOleh:id,nama_lengkap']);

        return $this->successResponse($data, 'Data iklim harian berhasil diperbarui.');
    }

    /**
     * Hapus data iklim harian.
     */
    public function destroy(int $dataIklimHarian): JsonResponse
    {
        $data = DataIklimHarian::find($dataIklimHarian);

        if (!$data) {
            return $this->errorResponse('Data iklim harian tidak ditemukan.', null, 404);
        }

        $data->delete();

        return $this->successResponse(null, 'Data iklim harian berhasil dihapus.');
    }

    /**
     * Import data iklim harian dari file CSV BMKG.
     *
     * File CSV harus didownload manual dari Data Online BMKG (dataonline.bmkg.go.id),
     * karena BMKG tidak menyediakan API untuk data historis curah hujan.
     */
    public function importCsv(ImportCsvRequest $request, CsvImportService $csvImportService): JsonResponse
    {
        $file = $request->file('file');
        $stasiunId = (int) $request->input('stasiun_id');
        $userId = $request->user()->id;

        // Simpan file sementara
        $filePath = $file->getRealPath();

        // Jalankan import via service
        $result = $csvImportService->importFromFile($filePath, $stasiunId, $userId);

        // Tentukan HTTP status berdasarkan hasil
        if ($result['sukses'] === 0 && $result['gagal'] > 0) {
            return $this->errorResponse('Import CSV gagal. Tidak ada data yang berhasil disimpan.', [
                'ringkasan' => $result,
            ], 422);
        }

        $message = "Import CSV selesai. {$result['sukses']} data berhasil, {$result['dilewati']} baris dilewati, {$result['gagal']} gagal.";

        return $this->successResponse([
            'ringkasan' => $result,
        ], $message, 201);
    }
}
