<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Hapus penyimpanan prakiraan cuaca dari backend.
     *
     * Landing page mengambil prakiraan langsung dari API publik BMKG,
     * sehingga tabel ini tidak lagi menjadi bagian dari skema aplikasi.
     */
    public function up(): void
    {
        Schema::dropIfExists('prakiraan_cuaca_bmkg');
    }

    /**
     * Pulihkan tabel jika migration di-rollback.
     */
    public function down(): void
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

            $table->unique(
                ['kode_adm4', 'datetime_prakiraan'],
                'uq_prakiraan_wilayah_waktu'
            );
        });
    }
};
