<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreKontenLandingPageRequest;
use App\Http\Requests\Admin\UpdateKontenLandingPageRequest;
use App\Models\KontenLandingPage;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KontenLandingPageController extends Controller
{
    use ApiResponse;

    /**
     * Tampilkan daftar konten landing page (paginasi, filter tipe & is_active).
     */
    public function index(Request $request): JsonResponse
    {
        $query = KontenLandingPage::with('dibuatOleh:id,nama_lengkap')
            ->orderBy('urutan_tampil', 'asc')
            ->orderBy('created_at', 'desc');

        // Filter berdasarkan tipe (pengumuman/tips)
        if ($request->has('tipe')) {
            $query->where('tipe', $request->input('tipe'));
        }

        // Filter berdasarkan status aktif
        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $konten = $query->paginate($request->input('per_page', 15));

        return $this->successResponse($konten, 'Data konten landing page berhasil diambil');
    }

    /**
     * Tampilkan detail satu konten landing page.
     */
    public function show(KontenLandingPage $kontenLandingPage): JsonResponse
    {
        $kontenLandingPage->load('dibuatOleh:id,nama_lengkap');

        return $this->successResponse($kontenLandingPage, 'Detail konten berhasil diambil');
    }

    /**
     * Simpan konten landing page baru.
     */
    public function store(StoreKontenLandingPageRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['dibuat_oleh'] = auth()->id();

        $konten = KontenLandingPage::create($data);
        $konten->load('dibuatOleh:id,nama_lengkap');

        return $this->successResponse($konten, 'Konten landing page berhasil dibuat', 201);
    }

    /**
     * Update konten landing page.
     */
    public function update(UpdateKontenLandingPageRequest $request, KontenLandingPage $kontenLandingPage): JsonResponse
    {
        $kontenLandingPage->update($request->validated());
        $kontenLandingPage->load('dibuatOleh:id,nama_lengkap');

        return $this->successResponse($kontenLandingPage, 'Konten landing page berhasil diperbarui');
    }

    /**
     * Hapus konten landing page.
     */
    public function destroy(KontenLandingPage $kontenLandingPage): JsonResponse
    {
        $kontenLandingPage->delete();

        return $this->successResponse(null, 'Konten landing page berhasil dihapus');
    }
}
