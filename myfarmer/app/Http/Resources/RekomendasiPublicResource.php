<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource untuk hasil rekomendasi publik.
 *
 * Menampilkan status rekomendasi dan data dasarian terkait,
 * TANPA mengekspos kolom internal (catatan_teknis, rule_id, internal IDs).
 */
class RekomendasiPublicResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'status_rekomendasi' => $this->status_rekomendasi,
            'label_rekomendasi'  => $this->getLabelRekomendasi(),
            'tanggal_evaluasi'   => $this->generated_at?->format('Y-m-d H:i'),
            'rule' => $this->whenLoaded('rule', fn () => [
                'nama' => $this->rule->nama_rule,
            ]),
            'dasarian' => $this->whenLoaded('dasarian', fn () => [
                'tahun'       => $this->dasarian->tahun,
                'bulan'       => $this->dasarian->bulan,
                'dasarian_ke' => $this->dasarian->dasarian_ke,
                'total_curah_hujan_mm' => $this->dasarian->total_curah_hujan_mm,
                'status_musim' => $this->dasarian->status_musim,
                'stasiun' => $this->dasarian->relationLoaded('stasiun')
                    ? ['nama' => $this->dasarian->stasiun->nama_stasiun]
                    : null,
            ]),
        ];
    }

    /**
     * Map status_rekomendasi ke label yang mudah dipahami petani.
     */
    private function getLabelRekomendasi(): string
    {
        return match ($this->status_rekomendasi) {
            'optimal_tanam'    => 'Waktu yang baik untuk menanam padi',
            'tunggu'           => 'Belum waktunya, pantau terus cuaca',
            'tidak_disarankan' => 'Belum disarankan untuk menanam',
            default            => $this->status_rekomendasi,
        };
    }
}
