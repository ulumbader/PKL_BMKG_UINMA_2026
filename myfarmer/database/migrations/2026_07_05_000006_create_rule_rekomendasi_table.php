<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Definisi rule rekomendasi dengan parameter JSON.
     * Parameter HARUS dibaca dari kolom 'parameter', TIDAK boleh di-hardcode di service/controller.
     */
    public function up(): void
    {
        Schema::create('rule_rekomendasi', function (Blueprint $table) {
            $table->id();
            $table->string('nama_rule');
            $table->text('deskripsi')->nullable();
            $table->json('parameter')->comment('Threshold dan parameter rule, WAJIB dibaca dari sini, jangan hardcode');
            $table->boolean('is_active')->default(true);
            $table->foreignId('dibuat_oleh')->constrained('users')->onDelete('restrict');
            $table->foreignId('diubah_oleh')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('updated_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rule_rekomendasi');
    }
};
