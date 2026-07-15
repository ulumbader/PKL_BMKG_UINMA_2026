<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Aggregated layer — hasil agregasi per dasarian (10 hari).
     * Data dibaca dari data_iklim_harian, TIDAK menghapus/menimpa raw layer.
     */
    public function up(): void
    {
        Schema::create('data_iklim_dasarian', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stasiun_id')->constrained('stasiun_iklim')->onDelete('restrict');
            $table->smallInteger('tahun');
            $table->tinyInteger('bulan');
            $table->tinyInteger('dasarian_ke')->comment('1, 2, atau 3');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->decimal('total_curah_hujan_mm', 7, 1)->default(0);
            $table->tinyInteger('jumlah_hari_hujan')->unsigned()->default(0);
            $table->tinyInteger('jumlah_hari_valid')->unsigned()->default(0);
            $table->tinyInteger('jumlah_hari_missing')->unsigned()->default(0);
            $table->enum('status_musim', ['basah', 'normal', 'kering'])->nullable();
            $table->dateTime('dihitung_pada')->nullable();

            // Unique constraint: satu stasiun per periode dasarian
            $table->unique(['stasiun_id', 'tahun', 'bulan', 'dasarian_ke'], 'uq_dasarian_periode');

            // Index tambahan untuk query per tahun-bulan
            $table->index(['tahun', 'bulan'], 'idx_dasarian_tahun_bulan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('data_iklim_dasarian');
    }
};
