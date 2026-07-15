<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource untuk ringkasan AI publik.
 *
 * Hanya menampilkan teks ringkasan dan metadata publikasi.
 * TIDAK mengekspos: id internal, hasil_rekomendasi_id, direview_oleh,
 * is_edited_manual, generated_at, status (sudah pasti 'published').
 */
class RingkasanPublicResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'ringkasan'    => $this->ringkasan_text,
            'published_at' => $this->published_at?->format('Y-m-d H:i'),
            'rekomendasi'  => $this->whenLoaded('hasilRekomendasi', function () {
                $hr = $this->hasilRekomendasi;
                return [
                    'status_rekomendasi' => $hr->status_rekomendasi,
                    'dasarian' => $hr->relationLoaded('dasarian') ? [
                        'tahun'       => $hr->dasarian->tahun,
                        'bulan'       => $hr->dasarian->bulan,
                        'dasarian_ke' => $hr->dasarian->dasarian_ke,
                        'total_curah_hujan_mm' => $hr->dasarian->total_curah_hujan_mm,
                        'status_musim' => $hr->dasarian->status_musim,
                    ] : null,
                    'rule' => $hr->relationLoaded('rule') ? [
                        'nama' => $hr->rule->nama_rule,
                    ] : null,
                ];
            }),
        ];
    }
}
