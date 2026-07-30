<?php

namespace App\Http\Resources;

use App\Models\HasilRekomendasi;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GrafikCurahHujanResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var HasilRekomendasi|null $rekomendasi */
        $rekomendasi = $this->relationLoaded('hasilRekomendasi')
            ? $this->hasilRekomendasi->first()
            : null;

        return [
            'periode' => [
                'tahun' => (int) $this->tahun,
                'bulan' => (int) $this->bulan,
                'periode_ke' => (int) $this->dasarian_ke,
                'label' => $this->labelPeriode(),
                'tanggal_mulai' => $this->tanggal_mulai?->format('Y-m-d'),
                'tanggal_selesai' => $this->tanggal_selesai?->format('Y-m-d'),
                'dalam_mt1' => $this->getAttribute('dalam_mt1'),
            ],
            'curah_hujan' => [
                'total_mm' => (float) $this->total_curah_hujan_mm,
                'jumlah_hari_hujan' => (int) $this->jumlah_hari_hujan,
                'jumlah_hari_valid' => (int) $this->jumlah_hari_valid,
                'jumlah_hari_missing' => (int) $this->jumlah_hari_missing,
            ],
            'rekomendasi' => [
                'status' => $rekomendasi?->status_rekomendasi,
                'label' => $this->labelRekomendasi($rekomendasi?->status_rekomendasi),
                'tanggal_evaluasi' => $rekomendasi?->generated_at?->toIso8601String(),
            ],
        ];
    }

    /**
     * Label periode dibuat ramah petani tanpa istilah teknis "dasarian".
     */
    private function labelPeriode(): string
    {
        if (! $this->tanggal_mulai || ! $this->tanggal_selesai) {
            return "Periode {$this->dasarian_ke} bulan {$this->bulan}/{$this->tahun}";
        }

        return sprintf(
            '%d–%d %s %d',
            $this->tanggal_mulai->day,
            $this->tanggal_selesai->day,
            $this->namaBulan((int) $this->bulan),
            $this->tahun
        );
    }

    private function labelRekomendasi(?string $status): string
    {
        return match ($status) {
            'optimal_tanam' => 'Waktu yang baik untuk menanam padi',
            'tunggu' => 'Belum waktunya, pantau terus cuaca',
            'tidak_disarankan' => 'Belum disarankan untuk menanam',
            default => 'Belum dianalisis',
        };
    }

    private function namaBulan(int $bulan): string
    {
        return match ($bulan) {
            1 => 'Januari',
            2 => 'Februari',
            3 => 'Maret',
            4 => 'April',
            5 => 'Mei',
            6 => 'Juni',
            7 => 'Juli',
            8 => 'Agustus',
            9 => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember',
            default => 'Tidak diketahui',
        };
    }
}
