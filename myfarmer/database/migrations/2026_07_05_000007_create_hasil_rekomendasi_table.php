<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Output rule engine per periode dasarian.
     */
    public function up(): void
    {
        Schema::create('hasil_rekomendasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dasarian_id')->constrained('data_iklim_dasarian')->onDelete('cascade');
            $table->foreignId('rule_id')->constrained('rule_rekomendasi')->onDelete('restrict');
            $table->enum('status_rekomendasi', ['optimal_tanam', 'tunggu', 'tidak_disarankan']);
            $table->text('catatan_teknis')->nullable();
            $table->dateTime('generated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hasil_rekomendasi');
    }
};
