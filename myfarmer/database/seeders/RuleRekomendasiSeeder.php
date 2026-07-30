<?php

namespace Database\Seeders;

use App\Models\RuleRekomendasi;
use App\Models\User;
use Illuminate\Database\Seeder;

class RuleRekomendasiSeeder extends Seeder
{
    /**
     * Seed rule default: "Rule Awal Musim Tanam".
     *
     * Logika: kriteria utama diperiksa lebih dulu, kemudian total alternatif
     * menjadi fallback, dan kriteria minimal hari hujan dapat memperkuat hasil.
     *
     * Parameter threshold disimpan di kolom JSON 'parameter' dan DIBACA
     * dari database saat evaluasi (Golden Rule #5, tidak di-hardcode).
     */
    public function run(): void
    {
        // Ambil akun super_admin dari AdminSeeder (Tahap 3)
        $superAdmin = User::whereHas('role', function ($q) {
            $q->where('nama_role', 'super_admin');
        })->first();

        if (! $superAdmin) {
            $this->command->warn('Super admin tidak ditemukan. Jalankan AdminSeeder terlebih dahulu.');

            return;
        }

        RuleRekomendasi::updateOrCreate(
            ['nama_rule' => 'Rule Awal Musim Tanam'],
            [
                'deskripsi' => 'Menentukan awal musim tanam padi dengan kriteria utama, '
                    .'fallback total curah hujan alternatif, serta penguatan jumlah hari hujan per dasarian '
                    .'berdasarkan kajian Ulfah dan Sulistya untuk wilayah Jawa Timur.',
                'parameter' => [
                    'min_curah_hujan_dasarian' => 50,
                    'min_dasarian_berturut' => 3,
                    'total_alternatif_mm' => 150,
                    'pakai_kriteria_hari_hujan' => true,
                    'min_hari_hujan_dasarian' => 3,
                ],
                'is_active' => true,
                'dibuat_oleh' => $superAdmin->id,
                'diubah_oleh' => $superAdmin->id,
            ]
        );
    }
}
