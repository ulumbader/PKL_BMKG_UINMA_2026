<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ringkasan AI dari Gemini API berdasarkan hasil rekomendasi.
     */
    public function up(): void
    {
        Schema::create('ringkasan_ai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hasil_rekomendasi_id')->constrained('hasil_rekomendasi')->onDelete('cascade');
            $table->text('ringkasan_text');
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->boolean('is_edited_manual')->default(false);
            $table->foreignId('direview_oleh')->nullable()->constrained('users')->onDelete('set null');
            $table->dateTime('generated_at');
            $table->dateTime('published_at')->nullable();

            // Index untuk query ringkasan yang sudah published (landing page)
            $table->index('status', 'idx_ringkasan_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ringkasan_ai');
    }
};
