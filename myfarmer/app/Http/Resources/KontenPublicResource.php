<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource untuk konten landing page publik.
 *
 * Menampilkan judul, isi, tipe konten.
 * TIDAK mengekspos: id internal, dibuat_oleh, is_active (sudah pasti true),
 * urutan_tampil (sudah diurutkan di query), timestamps internal.
 */
class KontenPublicResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'judul' => $this->judul,
            'isi'   => $this->isi,
            'tipe'  => $this->tipe,
        ];
    }
}
