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
     * Logika: Musim tanam padi optimal jika curah hujan >= 50mm/dasarian
     * selama minimal 3 dasarian berturut-turut. Ini menandakan awal musim
     * hujan yang cukup stabil untuk memulai penanaman.
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

        if (!$superAdmin) {
            $this->command->warn('Super admin tidak ditemukan. Jalankan AdminSeeder terlebih dahulu.');
            return;
        }

        RuleRekomendasi::updateOrCreate(
            ['nama_rule' => 'Rule Awal Musim Tanam'],
            [
                'deskripsi'   => 'Menentukan waktu optimal tanam padi berdasarkan curah hujan. '
                    . 'Musim tanam dianggap optimal jika curah hujan >= threshold (mm) '
                    . 'selama beberapa dasarian berturut-turut, menandakan awal musim hujan yang stabil.',
                'parameter'   => [
                    'min_curah_hujan_dasarian' => 50,
                    'min_dasarian_berturut'    => 3,
                ],
                'is_active'   => true,
                'dibuat_oleh' => $superAdmin->id,
                'diubah_oleh' => $superAdmin->id,
            ]
        );
    }
}
