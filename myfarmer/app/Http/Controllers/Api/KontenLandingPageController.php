<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreKontenLandingPageRequest;
use App\Http\Requests\Admin\UpdateKontenLandingPageRequest;
use App\Models\KontenLandingPage;
use App\Services\MediaKontenService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Throwable;

class KontenLandingPageController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly MediaKontenService $mediaService) {}

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
        $validated = $request->validated();
        $data = Arr::except($validated, ['file_media', 'thumbnail']);
        $data['dibuat_oleh'] = auth()->id();
        $newPaths = [];

        try {
            if ($request->hasFile('file_media')) {
                $stored = $this->mediaService->store($request->file('file_media'), $data['tipe']);
                $data['path_file'] = $stored['path'];
                $data['jenis_media'] = $stored['jenis_media'];
                $newPaths[] = $stored['path'];
            }

            if ($request->hasFile('thumbnail')) {
                $thumbnail = $this->mediaService->store($request->file('thumbnail'), $data['tipe'], true);
                $data['path_thumbnail'] = $thumbnail['path'];
                $newPaths[] = $thumbnail['path'];
            }

            $konten = DB::transaction(fn () => KontenLandingPage::create($data));
        } catch (Throwable $exception) {
            foreach ($newPaths as $path) {
                $this->mediaService->deleteManaged($path);
            }

            throw $exception;
        }

        $konten->load('dibuatOleh:id,nama_lengkap');

        return $this->successResponse($konten, 'Konten landing page berhasil dibuat', 201);
    }

    /**
     * Update konten landing page.
     */
    public function update(UpdateKontenLandingPageRequest $request, KontenLandingPage $kontenLandingPage): JsonResponse
    {
        $validated = $request->validated();
        $data = Arr::except($validated, ['file_media', 'thumbnail', 'hapus_thumbnail']);
        $targetType = $data['tipe'] ?? $kontenLandingPage->tipe;
        $oldFile = $kontenLandingPage->path_file;
        $oldThumbnail = $kontenLandingPage->path_thumbnail;
        $newPaths = [];
        $deleteAfterCommit = [];

        try {
            if ($request->hasFile('file_media')) {
                $stored = $this->mediaService->store($request->file('file_media'), $targetType);
                $data['path_file'] = $stored['path'];
                $data['jenis_media'] = $stored['jenis_media'];
                $newPaths[] = $stored['path'];
                $deleteAfterCommit[] = $oldFile;
            }

            if ($request->hasFile('thumbnail')) {
                $thumbnail = $this->mediaService->store($request->file('thumbnail'), $targetType, true);
                $data['path_thumbnail'] = $thumbnail['path'];
                $newPaths[] = $thumbnail['path'];
                $deleteAfterCommit[] = $oldThumbnail;
            } elseif ($request->boolean('hapus_thumbnail')) {
                $data['path_thumbnail'] = null;
                $deleteAfterCommit[] = $oldThumbnail;
            }

            if (in_array($targetType, ['pengumuman', 'tips'], true)) {
                $data['jenis_media'] = null;
                $data['path_file'] = null;
                $data['path_thumbnail'] = null;
                $data['url_sumber'] = null;
                $data['alt_text'] = null;
                $deleteAfterCommit[] = $oldFile;
                $deleteAfterCommit[] = $oldThumbnail;
            } else {
                $data['isi'] = null;
            }

            DB::transaction(function () use ($kontenLandingPage, $data): void {
                $kontenLandingPage->update($data);
            });
        } catch (Throwable $exception) {
            foreach ($newPaths as $path) {
                $this->mediaService->deleteManaged($path);
            }

            throw $exception;
        }

        foreach (array_unique(array_filter($deleteAfterCommit)) as $path) {
            if (! in_array($path, $newPaths, true)) {
                $this->mediaService->deleteManaged($path);
            }
        }

        $kontenLandingPage->load('dibuatOleh:id,nama_lengkap');

        return $this->successResponse($kontenLandingPage, 'Konten landing page berhasil diperbarui');
    }

    /**
     * Hapus konten landing page.
     */
    public function destroy(KontenLandingPage $kontenLandingPage): JsonResponse
    {
        $paths = [$kontenLandingPage->path_file, $kontenLandingPage->path_thumbnail];

        DB::transaction(fn () => $kontenLandingPage->delete());

        foreach ($paths as $path) {
            $this->mediaService->deleteManaged($path);
        }

        return $this->successResponse(null, 'Konten landing page berhasil dihapus');
    }
}
