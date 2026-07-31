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
                    'Authorization' => 'Bearer '.$this->apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => $this->model,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'Kamu adalah penasihat pertanian padi yang membantu petani di Kecamatan Karangploso, Kabupaten Malang, Jawa Timur. Gunakan Bahasa Indonesia yang sederhana, hangat, dan mudah dipahami petani. Utamakan ketepatan fakta: jangan mengubah angka, mencampur cakupan waktu, atau menyimpulkan data yang tidak diberikan.',
                        ],
                        [
                            'role' => 'user',
                            'content' => $this->buildPrompt($dataDasarian, $dataRekomendasi),
                        ],
                    ],
                    'temperature' => 0.2,
                    'max_completion_tokens' => 1024,
                ],
            ]);

            $body = json_decode($response->getBody()->getContents(), true);
            $choice = $body['choices'][0] ?? [];
            $text = $choice['message']['content'] ?? null;
            $finishReason = $choice['finish_reason'] ?? null;

            if (empty($text) || $finishReason !== 'stop') {
                Log::warning('GroqService: Response Groq kosong atau tidak selesai.', [
                    'finish_reason' => $finishReason,
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
        $kalimatFakta = "Pada periode terbaru, curah hujan tercatat {$totalCH} mm dengan {$hariHujan} hari hujan dari {$hariValid} hari data valid.";

        return <<<PROMPT
Berikut data yang perlu kamu ringkas. Perhatikan bahwa data periode terbaru dan catatan evaluasi dapat memiliki cakupan waktu yang berbeda.

=== FAKTA PERIODE TERBARU ===
- Periode: {$periodeLabel} saja, bukan total beberapa periode
- Stasiun: {$namaStasiun}
- Curah hujan periode terbaru: {$totalCH} mm
- Hari hujan periode terbaru: {$hariHujan} hari
- Jumlah hari data valid: {$hariValid} hari
- Kondisi musim: {$statusMusim}
- Kalimat fakta wajib: {$kalimatFakta}

=== KONTEKS KEPUTUSAN ===
- Rule yang digunakan: {$namaRule}
- Kesimpulan: {$statusAwam}
- Catatan evaluasi yang dapat mencakup beberapa periode: {$catatanTeknis}

=== ATURAN AKURASI WAJIB ===
1. Bedakan angka periode terbaru dari total beberapa periode pada catatan evaluasi.
2. Pertahankan angka sesuai sumber; jangan membulatkan, menjumlahkan, atau menebak angka baru.
3. Jangan mengubah beberapa dasarian menjadi "beberapa minggu" karena satu dasarian bukan satu minggu.
4. Jika menyebut total beberapa periode, gunakan hanya total yang tertulis eksplisit pada catatan evaluasi dan sebut sebagai "beberapa periode terakhir".
5. Nilai hari hujan pada fakta periode terbaru hanya berlaku untuk periode terbaru, bukan seluruh jendela evaluasi.
6. Jangan menggunakan kata "lembap", "kelembapan", "tanah", "irigasi", atau membuat pernyataan mengenai hasil panen dan prakiraan cuaca karena data tersebut tidak diberikan.
7. Ikuti kesimpulan rekomendasi yang diberikan tanpa mengubah statusnya.
8. Gunakan kalimat fakta wajib sebagai kalimat pertama secara persis tanpa mengubah angka maupun susunan faktanya.
9. Jika catatan evaluasi menyebut "total CH" secara eksplisit, jelaskan angka itu secara terpisah sebagai total curah hujan beberapa periode terakhir tanpa menebak durasinya.

=== TUGAS ===
Buatlah ringkasan singkat 3-5 kalimat dalam Bahasa Indonesia yang:
1. Dimulai dengan kalimat fakta wajib, kemudian menjelaskan kondisi curah hujan dengan bahasa sederhana.
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
            ."Pada periode {$periodeLabel}, total curah hujan tercatat {$totalCH} mm. "
            .$pesanRekomendasi;
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
