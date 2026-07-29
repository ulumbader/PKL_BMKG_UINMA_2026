<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\GrafikCurahHujanRequest;
use App\Http\Resources\CuacaDasarianResource;
use App\Http\Resources\GrafikCurahHujanResource;
use App\Http\Resources\KontenPublicResource;
use App\Http\Resources\MediaPublicResource;
use App\Http\Resources\RekomendasiPublicResource;
use App\Http\Resources\RingkasanPublicResource;
use App\Models\DataIklimDasarian;
use App\Models\HasilRekomendasi;
use App\Models\KontenLandingPage;
use App\Models\RingkasanAi;
use App\Models\RuleRekomendasi;
use App\Models\StasiunIklim;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * Controller untuk endpoint publik landing page petani.
 *
 * Semua method di sini:
 *   - TANPA middleware auth (Golden Rule #7)
 *   - Hanya method GET
 *   - Response memakai API Resource class (tidak ekspos kolom internal)
 *   - Mengikuti format response standar via ApiResponse trait
 */
class PublicController extends Controller
{
    use ApiResponse;

    // =========================================================================
    // GRAFIK CURAH HUJAN — Histori per 10 hari dan rekomendasi tanam
    // =========================================================================

    /**
     * Kembalikan histori curah hujan per 10 hari untuk kebutuhan grafik publik.
     *
     * Rule publik dipilih dari rule aktif dengan ID paling awal yang sudah
     * memiliki hasil untuk stasiun default. Jika belum ada hasil evaluasi,
     * gunakan rule aktif paling awal agar batas grafik tetap berasal dari DB.
     */
    public function grafikCurahHujan(GrafikCurahHujanRequest $request): JsonResponse
    {
        $jumlahPeriode = (int) ($request->validated()['jumlah_periode'] ?? 12);
        $stasiun = StasiunIklim::orderBy('id')->first();

        if (! $stasiun) {
            return $this->successResponse(null, 'Belum ada data stasiun iklim.');
        }

        $rule = RuleRekomendasi::where('is_active', true)
            ->whereHas('hasilRekomendasi.dasarian', function ($query) use ($stasiun): void {
                $query->where('stasiun_id', $stasiun->id);
            })
            ->orderBy('id')
            ->first();

        $rule ??= RuleRekomendasi::where('is_active', true)
            ->orderBy('id')
            ->first();

        $query = DataIklimDasarian::where('stasiun_id', $stasiun->id)
            ->orderByDesc('tahun')
            ->orderByDesc('bulan')
            ->orderByDesc('dasarian_ke')
            ->limit($jumlahPeriode);

        if ($rule) {
            $query->with(['hasilRekomendasi' => function ($query) use ($rule): void {
                $query->where('rule_id', $rule->id)
                    ->select('id', 'dasarian_id', 'rule_id', 'status_rekomendasi', 'generated_at');
            }]);
        }

        $periode = $query->get()->reverse()->values();

        if ($periode->isEmpty()) {
            return $this->successResponse(null, 'Belum ada data curah hujan 10 harian.');
        }

        $parameter = $rule?->parameter ?? [];

        return $this->successResponse([
            'stasiun' => [
                'nama' => $stasiun->nama_stasiun,
                'kode_wmo' => $stasiun->kode_wmo,
            ],
            'rule' => $rule ? [
                'nama' => $rule->nama_rule,
                'batas_curah_hujan_mm' => isset($parameter['min_curah_hujan_dasarian'])
                    ? (float) $parameter['min_curah_hujan_dasarian']
                    : null,
                'jumlah_periode_berturut' => isset($parameter['min_dasarian_berturut'])
                    ? (int) $parameter['min_dasarian_berturut']
                    : null,
                'batas_total_alternatif_mm' => isset($parameter['total_alternatif_mm'])
                    ? (float) $parameter['total_alternatif_mm']
                    : null,
                'kriteria_hari_hujan_aktif' => isset($parameter['pakai_kriteria_hari_hujan'])
                    ? (bool) $parameter['pakai_kriteria_hari_hujan']
                    : null,
                'batas_hari_hujan' => isset($parameter['min_hari_hujan_dasarian'])
                    ? (int) $parameter['min_hari_hujan_dasarian']
                    : null,
            ] : null,
            'jumlah_periode' => $periode->count(),
            'periode' => GrafikCurahHujanResource::collection($periode)->resolve($request),
        ], 'Data grafik curah hujan dan rekomendasi tanam berhasil diambil.');
    }

    // =========================================================================
    // CUACA TERKINI — Data dasarian paling baru
    // =========================================================================

    /**
     * Kembalikan data curah hujan dasarian paling baru untuk stasiun default.
     *
     * Stasiun default = stasiun pertama di tabel stasiun_iklim.
     * Jika tidak ada data, kembalikan pesan informatif (bukan error 404).
     */
    public function cuacaTerkini(): JsonResponse
    {
        // Ambil stasiun default (pertama yang ada di database)
        $stasiun = StasiunIklim::first();

        if (! $stasiun) {
            return $this->successResponse(null, 'Belum ada data stasiun iklim.');
        }

        $dasarian = DataIklimDasarian::with('stasiun:id,nama_stasiun,kode_wmo')
            ->where('stasiun_id', $stasiun->id)
            ->orderBy('tahun', 'desc')
            ->orderBy('bulan', 'desc')
            ->orderBy('dasarian_ke', 'desc')
            ->first();

        if (! $dasarian) {
            return $this->successResponse(null, 'Belum ada data curah hujan dasarian.');
        }

        return $this->successResponse(
            new CuacaDasarianResource($dasarian),
            'Data cuaca terkini berhasil diambil.'
        );
    }

    // =========================================================================
    // REKOMENDASI TERKINI — Hasil rekomendasi paling baru
    // =========================================================================

    /**
     * Kembalikan hasil rekomendasi paling baru beserta relasi dasarian-nya.
     *
     * Mengambil hasil rekomendasi terbaru berdasarkan generated_at,
     * dengan relasi ke data dasarian dan nama rule.
     */
    public function rekomendasiTerkini(): JsonResponse
    {
        $rekomendasi = HasilRekomendasi::with([
            'dasarian:id,stasiun_id,tahun,bulan,dasarian_ke,total_curah_hujan_mm,status_musim',
            'dasarian.stasiun:id,nama_stasiun',
            'rule:id,nama_rule',
        ])
            ->orderBy('generated_at', 'desc')
            ->first();

        if (! $rekomendasi) {
            return $this->successResponse(null, 'Belum ada hasil rekomendasi.');
        }

        return $this->successResponse(
            new RekomendasiPublicResource($rekomendasi),
            'Rekomendasi terkini berhasil diambil.'
        );
    }

    // =========================================================================
    // RINGKASAN AI TERKINI — Ringkasan published paling baru
    // =========================================================================

    /**
     * Kembalikan ringkasan AI dengan status 'published' paling baru.
     *
     * Hanya ringkasan yang sudah disetujui admin yang ditampilkan.
     * Draft TIDAK ditampilkan ke publik.
     */
    public function ringkasanTerkini(): JsonResponse
    {
        $ringkasan = RingkasanAi::with([
            'hasilRekomendasi:id,dasarian_id,rule_id,status_rekomendasi',
            'hasilRekomendasi.dasarian:id,tahun,bulan,dasarian_ke,total_curah_hujan_mm,status_musim',
            'hasilRekomendasi.rule:id,nama_rule',
        ])
            ->where('status', 'published')
            ->orderBy('published_at', 'desc')
            ->first();

        if (! $ringkasan) {
            return $this->successResponse(null, 'Belum ada ringkasan AI yang dipublikasikan.');
        }

        return $this->successResponse(
            new RingkasanPublicResource($ringkasan),
            'Ringkasan AI terkini berhasil diambil.'
        );
    }

    // =========================================================================
    // KONTEN AKTIF — Pengumuman/tips landing page
    // =========================================================================

    /**
     * Kembalikan daftar konten landing page yang aktif.
     *
     * Diurutkan berdasarkan urutan_tampil (ascending).
     * Hanya konten dengan is_active = true yang ditampilkan.
     */
    public function kontenAktif(): JsonResponse
    {
        $konten = KontenLandingPage::where('is_active', true)
            ->whereIn('tipe', ['pengumuman', 'tips'])
            ->orderBy('urutan_tampil', 'asc')
            ->get();

        return $this->successResponse(
            KontenPublicResource::collection($konten),
            'Konten landing page berhasil diambil.'
        );
    }

    /**
     * Kembalikan media aktif yang sudah dikelompokkan dan diurutkan.
     */
    public function mediaAktif(): JsonResponse
    {
        $media = KontenLandingPage::query()
            ->where('is_active', true)
            ->whereIn('tipe', ['sorotan', 'poster', 'pdf'])
            ->orderBy('urutan_tampil')
            ->orderBy('id')
            ->get()
            ->groupBy('tipe');

        return $this->successResponse([
            'sorotan' => MediaPublicResource::collection($media->get('sorotan', collect())),
            'poster' => MediaPublicResource::collection($media->get('poster', collect())),
            'pdf' => MediaPublicResource::collection($media->get('pdf', collect())),
        ], 'Media landing page berhasil diambil.');
    }
}
