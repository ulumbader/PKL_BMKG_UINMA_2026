<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource untuk data cuaca (dasarian) publik.
 *
 * Menampilkan data curah hujan dasarian yang relevan untuk petani,
 * TANPA mengekspos kolom internal (id stasiun, jumlah_hari_missing, dihitung_pada).
 */
class CuacaDasarianResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'periode' => [
                'tahun'       => $this->tahun,
                'bulan'       => $this->bulan,
                'dasarian_ke' => $this->dasarian_ke,
                'tanggal_mulai'  => $this->tanggal_mulai?->format('Y-m-d'),
                'tanggal_selesai' => $this->tanggal_selesai?->format('Y-m-d'),
            ],
            'curah_hujan' => [
                'total_mm'        => $this->total_curah_hujan_mm,
                'jumlah_hari_hujan' => $this->jumlah_hari_hujan,
            ],
            'status_musim' => $this->status_musim,
            'stasiun' => [
                'nama'    => $this->whenLoaded('stasiun', fn () => $this->stasiun->nama_stasiun),
                'kode_wmo' => $this->whenLoaded('stasiun', fn () => $this->stasiun->kode_wmo),
            ],
        ];
    }
}
