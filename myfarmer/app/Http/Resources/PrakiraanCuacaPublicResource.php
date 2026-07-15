<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource untuk data prakiraan cuaca publik.
 *
 * Menampilkan data prakiraan cuaca dari API BMKG dalam format
 * yang ramah petani. TIDAK ekspos: id, kode_adm4, analysis_date, fetched_at.
 */
class PrakiraanCuacaPublicResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'waktu_prakiraan'  => $this->datetime_prakiraan?->timezone('Asia/Jakarta')->format('Y-m-d H:i'),
            'waktu_utc'        => $this->datetime_prakiraan?->format('Y-m-d H:i'),
            'suhu_celsius'     => $this->suhu,
            'curah_hujan_mm'   => $this->curah_hujan_3jam,
            'kelembapan_persen' => $this->kelembapan,
            'kecepatan_angin_kmjam' => $this->kecepatan_angin,
            'kondisi_cuaca'    => $this->kondisi_cuaca,
        ];
    }
}
