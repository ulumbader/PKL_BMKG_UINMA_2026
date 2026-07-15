<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\ServerException;
use Illuminate\Support\Facades\Log;

class GroqService
{
    private const BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
    private const TIMEOUT = 30;

    /**
     * @var Client
     */
    private $httpClient;

    /**
     * @var string|null
     */
    private $apiKey;

    /**
     * @var string
     */
    private $model;

    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key');
        $this->model = config('services.groq.model', 'openai/gpt-oss-120b');
        $this->httpClient = new Client([
            'timeout' => self::TIMEOUT,
            'connect_timeout' => 10,
        ]);
    }

    public function generateRingkasan(array $dataDasarian, array $dataRekomendasi): string
    {
        if (empty($this->apiKey)) {
            Log::error('GroqService: GROQ_API_KEY tidak dikonfigurasi di .env');
            return $this->fallbackRingkasan($dataDasarian, $dataRekomendasi);
        }

        try {
            $response = $this->httpClient->post(self::BASE_URL, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => $this->model,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'Kamu adalah penasihat pertanian padi yang membantu petani di Kecamatan Karangploso, Kabupaten Malang, Jawa Timur. Gunakan Bahasa Indonesia yang sederhana, hangat, dan mudah dipahami petani.',
                        ],
                        [
                            'role' => 'user',
                            'content' => $this->buildPrompt($dataDasarian, $dataRekomendasi),
                        ],
                    ],
                    'temperature' => 0.7,
                    'max_tokens' => 500,
                ],
            ]);

            $body = json_decode($response->getBody()->getContents(), true);
            $text = $body['choices'][0]['message']['content'] ?? null;

            if (empty($text)) {
                Log::warning('GroqService: Response Groq tidak mengandung teks.', [
                    'response_body' => $body,
                ]);
                return $this->fallbackRingkasan($dataDasarian, $dataRekomendasi);
            }

            return trim($text);
        } catch (ConnectException $e) {
            Log::error('GroqService: Timeout atau gagal koneksi ke Groq API.', [
                'error' => $e->getMessage(),
            ]);
        } catch (ClientException $e) {
            Log::error('GroqService: Client error dari Groq API.', [
                'status' => $e->getResponse()->getStatusCode(),
                'body' => $e->getResponse()->getBody()->getContents(),
            ]);
        } catch (ServerException $e) {
            Log::error('GroqService: Server error dari Groq API.', [
                'status' => $e->getResponse()->getStatusCode(),
                'body' => $e->getResponse()->getBody()->getContents(),
            ]);
        } catch (\Exception $e) {
            Log::error('GroqService: Error tidak terduga saat memanggil Groq API.', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        return $this->fallbackRingkasan($dataDasarian, $dataRekomendasi);
    }

    private function buildPrompt(array $dataDasarian, array $dataRekomendasi): string
    {
        $namaBulan = $this->getNamaBulan((int) ($dataDasarian['bulan'] ?? 0));
        $dasarianKe = $dataDasarian['dasarian_ke'] ?? '-';
        $tahun = $dataDasarian['tahun'] ?? '-';
        $totalCH = $dataDasarian['total_curah_hujan_mm'] ?? '-';
        $hariHujan = $dataDasarian['jumlah_hari_hujan'] ?? '-';
        $hariValid = $dataDasarian['jumlah_hari_valid'] ?? '-';
        $statusMusim = $dataDasarian['status_musim'] ?? '-';
        $namaStasiun = $dataDasarian['nama_stasiun'] ?? 'Stasiun Iklim';

        $statusRekomendasi = $dataRekomendasi['status_rekomendasi'] ?? '-';
        $namaRule = $dataRekomendasi['nama_rule'] ?? '-';
        $catatanTeknis = $dataRekomendasi['catatan_teknis'] ?? '-';

        $statusMap = [
            'optimal_tanam' => 'waktu yang baik untuk menanam',
            'tunggu' => 'belum waktunya menanam, masih menunggu',
            'tidak_disarankan' => 'belum disarankan untuk menanam',
        ];

        $statusAwam = $statusMap[$statusRekomendasi] ?? $statusRekomendasi;
        $periodeLabel = "Dasarian {$dasarianKe} bulan {$namaBulan} {$tahun}";

        return <<<PROMPT
Berikut data yang perlu kamu ringkas:

=== DATA CURAH HUJAN ===
- Periode: {$periodeLabel}
- Stasiun: {$namaStasiun}
- Total curah hujan: {$totalCH} mm
- Jumlah hari hujan: {$hariHujan} hari
- Jumlah hari data valid: {$hariValid} hari
- Kondisi musim: {$statusMusim}

=== HASIL ANALISIS REKOMENDASI ===
- Rule yang digunakan: {$namaRule}
- Kesimpulan: {$statusAwam}
- Detail teknis: {$catatanTeknis}

=== INSTRUKSI ===
Buatlah ringkasan singkat 3-5 kalimat dalam Bahasa Indonesia yang:
1. Menjelaskan kondisi curah hujan saat ini dengan bahasa sederhana.
2. Memberikan rekomendasi tanam padi berdasarkan kesimpulan di atas.
3. Tidak memakai istilah teknis seperti dasarian, threshold, agregasi, atau rule engine.
4. Terdengar hangat dan mendukung, seperti bicara langsung ke petani.
PROMPT;
    }

    private function fallbackRingkasan(array $dataDasarian, array $dataRekomendasi): string
    {
        $namaBulan = $this->getNamaBulan((int) ($dataDasarian['bulan'] ?? 0));
        $dasarianKe = $dataDasarian['dasarian_ke'] ?? '-';
        $tahun = $dataDasarian['tahun'] ?? '-';
        $totalCH = $dataDasarian['total_curah_hujan_mm'] ?? '-';
        $statusRekomendasi = $dataRekomendasi['status_rekomendasi'] ?? '-';

        $periodeLabel = "dasarian {$dasarianKe} bulan {$namaBulan} {$tahun}";

        $pesanRekomendasi = match ($statusRekomendasi) {
            'optimal_tanam' => 'Berdasarkan analisis, saat ini merupakan waktu yang baik untuk mulai menanam padi.',
            'tunggu' => 'Berdasarkan analisis, petani disarankan untuk menunggu dan terus memantau kondisi cuaca sebelum mulai menanam.',
            'tidak_disarankan' => 'Berdasarkan analisis, saat ini belum disarankan untuk menanam padi. Sebaiknya menunggu kondisi cuaca yang lebih mendukung.',
            default => 'Silakan konsultasi dengan petugas penyuluh pertanian setempat untuk informasi lebih lanjut.',
        };

        return '[Ringkasan otomatis - AI sedang tidak tersedia] '
            . "Pada periode {$periodeLabel}, total curah hujan tercatat {$totalCH} mm. "
            . $pesanRekomendasi;
    }

    private function getNamaBulan(int $bulan): string
    {
        $nama = [
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
        ];

        return $nama[$bulan] ?? 'Tidak Diketahui';
    }
}
