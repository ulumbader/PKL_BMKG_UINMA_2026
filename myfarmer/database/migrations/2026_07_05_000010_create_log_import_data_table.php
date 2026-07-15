<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Log setiap proses fetch/import data BMKG.
     */
    public function up(): void
    {
        Schema::create('log_import_data', function (Blueprint $table) {
            $table->id();
            $table->string('sumber')->default('BMKG_API');
            $table->enum('status', ['sukses', 'gagal']);
            $table->integer('jumlah_data_masuk')->unsigned()->default(0);
            $table->text('pesan_error')->nullable();
            $table->dateTime('waktu_mulai');
            $table->dateTime('waktu_selesai')->nullable();
            $table->foreignId('triggered_by')->nullable()->constrained('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('log_import_data');
    }
};
