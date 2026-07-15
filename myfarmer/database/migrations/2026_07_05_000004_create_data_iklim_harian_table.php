<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Raw layer — data curah hujan harian.
     * Sumber data HANYA 'manual' atau 'import_csv' (BMKG tidak menyediakan API untuk data historis).
     */
    public function up(): void
    {
        Schema::create('data_iklim_harian', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stasiun_id')->constrained('stasiun_iklim')->onDelete('restrict');
            $table->date('tanggal');
            $table->decimal('curah_hujan_mm', 6, 1)->nullable();
            $table->enum('kode_status', ['normal', 'tidak_terukur', 'tidak_ada_data'])->default('normal');
            $table->enum('sumber_data', ['manual', 'import_csv'])->default('import_csv');
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('created_at')->nullable();

            // Unique constraint: satu stasiun hanya punya satu data per tanggal
            $table->unique(['stasiun_id', 'tanggal']);

            // Index tambahan untuk query per tanggal
            $table->index('tanggal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('data_iklim_harian');
    }
};
