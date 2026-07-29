<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class MediaKontenService
{
    private const EXTENSIONS_BY_MIME = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'video/mp4' => 'mp4',
        'video/webm' => 'webm',
        'application/pdf' => 'pdf',
    ];

    public function store(UploadedFile $file, string $tipe, bool $thumbnail = false): array
    {
        $mime = $file->getMimeType();
        $extension = self::EXTENSIONS_BY_MIME[$mime] ?? null;

        if ($extension === null) {
            throw new RuntimeException('Tipe MIME file tidak didukung.');
        }

        $directory = 'media/'.$tipe.($thumbnail ? '/thumbnail' : '');
        $path = $file->storeAs($directory, Str::uuid().'.'.$extension, 'public');

        if ($path === false) {
            throw new RuntimeException('File media gagal disimpan.');
        }

        return [
            'path' => $path,
            'mime' => $mime,
            'jenis_media' => str_starts_with($mime, 'image/')
                ? 'image'
                : (str_starts_with($mime, 'video/') ? 'video' : 'pdf'),
        ];
    }

    public function deleteManaged(?string $path): void
    {
        if ($path === null || ! str_starts_with($path, 'media/')) {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
