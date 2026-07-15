<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambahkan index untuk query list/history yang sering filter + sort.
     */
    public function up(): void
    {
        Schema::table('audit_log', function (Blueprint $table) {
            $table->index('created_at', 'idx_audit_log_created_at');
            $table->index(['tabel_terkait', 'created_at'], 'idx_audit_log_tabel_created_at');
            $table->index(['aksi', 'created_at'], 'idx_audit_log_aksi_created_at');
        });

        Schema::table('log_import_data', function (Blueprint $table) {
            $table->index('waktu_mulai', 'idx_log_import_waktu_mulai');
            $table->index(['status', 'waktu_mulai'], 'idx_log_import_status_waktu');
            $table->index(['sumber', 'waktu_mulai'], 'idx_log_import_sumber_waktu');
        });

        Schema::table('hasil_rekomendasi', function (Blueprint $table) {
            $table->index('generated_at', 'idx_hasil_rekomendasi_generated_at');
            $table->index(['status_rekomendasi', 'generated_at'], 'idx_hasil_rekom_status_generated_at');
        });

        Schema::table('ringkasan_ai', function (Blueprint $table) {
            $table->index(['status', 'generated_at'], 'idx_ringkasan_status_generated_at');
            $table->index(['status', 'published_at'], 'idx_ringkasan_status_published_at');
        });

        Schema::table('konten_landing_page', function (Blueprint $table) {
            $table->index(['is_active', 'urutan_tampil'], 'idx_konten_active_urutan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('konten_landing_page', function (Blueprint $table) {
            $table->dropIndex('idx_konten_active_urutan');
        });

        Schema::table('ringkasan_ai', function (Blueprint $table) {
            $table->dropIndex('idx_ringkasan_status_published_at');
            $table->dropIndex('idx_ringkasan_status_generated_at');
        });

        Schema::table('hasil_rekomendasi', function (Blueprint $table) {
            $table->dropIndex('idx_hasil_rekom_status_generated_at');
            $table->dropIndex('idx_hasil_rekomendasi_generated_at');
        });

        Schema::table('log_import_data', function (Blueprint $table) {
            $table->dropIndex('idx_log_import_sumber_waktu');
            $table->dropIndex('idx_log_import_status_waktu');
            $table->dropIndex('idx_log_import_waktu_mulai');
        });

        Schema::table('audit_log', function (Blueprint $table) {
            $table->dropIndex('idx_audit_log_aksi_created_at');
            $table->dropIndex('idx_audit_log_tabel_created_at');
            $table->dropIndex('idx_audit_log_created_at');
        });
    }
};
