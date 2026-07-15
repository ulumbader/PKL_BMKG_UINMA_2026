<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Prakiraan cuaca real-time dari API publik BMKG.
     * Data ini TERPISAH dari data_iklim_harian dan TIDAK dipakai sebagai input rule engine.
     * Dipakai khusus untuk widget cuaca real-time di landing page.
     */
    public function up(): void
    {
        Schema::create('prakiraan_cuaca_bmkg', function (Blueprint $table) {
            $table->id();
            $table->string('kode_adm4', 20);
            $table->string('nama_wilayah')->nullable();
            $table->dateTime('datetime_prakiraan');
            $table->decimal('suhu', 4, 1)->nullable();
            $table->decimal('curah_hujan_3jam', 5, 1)->nullable();
            $table->decimal('kelembapan', 5, 1)->nullable();
            $table->decimal('kecepatan_angin', 5, 1)->nullable();
            $table->string('kondisi_cuaca')->nullable();
            $table->dateTime('analysis_date')->nullable();
            $table->dateTime('fetched_at');

            // Unique constraint: hindari duplikat saat fetch ulang
            $table->unique(['kode_adm4', 'datetime_prakiraan'], 'uq_prakiraan_wilayah_waktu');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prakiraan_cuaca_bmkg');
    }
};
