<?php

namespace Tests\Unit;

use App\Services\GroqService;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use ReflectionMethod;
use ReflectionProperty;
use Tests\TestCase;

class GroqServicePromptTest extends TestCase
{
    public function test_prompt_memisahkan_periode_terbaru_dari_jendela_evaluasi(): void
    {
        $service = app(GroqService::class);
        $buildPrompt = new ReflectionMethod($service, 'buildPrompt');

        $prompt = $buildPrompt->invoke(
            $service,
            [
                'tahun' => 2025,
                'bulan' => 2,
                'dasarian_ke' => 3,
                'total_curah_hujan_mm' => 196.8,
                'jumlah_hari_hujan' => 7,
                'jumlah_hari_valid' => 8,
                'status_musim' => 'basah',
                'nama_stasiun' => 'Stasiun Klimatologi Jawa Timur',
            ],
            [
                'status_rekomendasi' => 'optimal_tanam',
                'nama_rule' => 'Rule Awal Musim Tanam',
                'catatan_teknis' => 'Total CH 289.2mm. D1: HH 4 hari | D2: HH 6 hari | D3: HH 7 hari.',
            ]
        );

        $this->assertStringContainsString('=== FAKTA PERIODE TERBARU ===', $prompt);
        $this->assertStringContainsString('Curah hujan periode terbaru: 196.8 mm', $prompt);
        $this->assertStringContainsString('Hari hujan periode terbaru: 7 hari', $prompt);
        $this->assertStringContainsString('Kalimat fakta wajib: Pada periode terbaru, curah hujan tercatat 196.8 mm dengan 7 hari hujan dari 8 hari data valid.', $prompt);
        $this->assertStringContainsString('Catatan evaluasi yang dapat mencakup beberapa periode: Total CH 289.2mm', $prompt);
        $this->assertStringContainsString('Bedakan angka periode terbaru dari total beberapa periode', $prompt);
        $this->assertStringContainsString('jangan membulatkan, menjumlahkan, atau menebak angka baru', $prompt);
        $this->assertStringContainsString('Jangan menggunakan kata "lembap", "kelembapan", "tanah", "irigasi"', $prompt);
        $this->assertStringContainsString('Gunakan kalimat fakta wajib sebagai kalimat pertama secara persis', $prompt);
        $this->assertStringContainsString('jelaskan angka itu secara terpisah sebagai total curah hujan beberapa periode terakhir', $prompt);
    }

    public function test_response_yang_terpotong_menggunakan_ringkasan_fallback(): void
    {
        $mock = new MockHandler([
            new Response(200, [], json_encode([
                'choices' => [[
                    'message' => ['content' => 'Ringkasan yang belum selesai'],
                    'finish_reason' => 'length',
                ]],
            ], JSON_THROW_ON_ERROR)),
        ]);

        $service = app(GroqService::class);

        $httpClient = new ReflectionProperty($service, 'httpClient');
        $httpClient->setValue($service, new Client(['handler' => HandlerStack::create($mock)]));

        $apiKey = new ReflectionProperty($service, 'apiKey');
        $apiKey->setValue($service, 'test-key');

        $result = $service->generateRingkasan(
            [
                'tahun' => 2025,
                'bulan' => 2,
                'dasarian_ke' => 3,
                'total_curah_hujan_mm' => 196.8,
                'jumlah_hari_hujan' => 7,
            ],
            ['status_rekomendasi' => 'optimal_tanam']
        );

        $this->assertStringStartsWith('[Ringkasan otomatis - AI sedang tidak tersedia]', $result);
        $this->assertStringContainsString('196.8 mm', $result);
        $this->assertStringNotContainsString('Ringkasan yang belum selesai', $result);
    }
}
