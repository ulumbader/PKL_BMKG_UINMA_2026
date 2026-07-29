<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaPublicResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'judul' => $this->judul,
            'tipe' => $this->tipe,
            'jenis_media' => $this->jenis_media,
            'file_url' => $this->file_url,
            'thumbnail_url' => $this->thumbnail_url,
            'url_sumber' => $this->url_sumber,
            'alt_text' => $this->alt_text ?: $this->judul,
        ];
    }
}
