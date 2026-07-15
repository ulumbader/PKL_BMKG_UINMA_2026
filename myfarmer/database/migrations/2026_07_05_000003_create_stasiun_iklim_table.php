<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('stasiun_iklim', function (Blueprint $table) {
            $table->id();
            $table->string('kode_wmo')->unique();
            $table->string('nama_stasiun');
            $table->decimal('lintang', 9, 5);
            $table->decimal('bujur', 9, 5);
            $table->integer('elevasi_meter')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stasiun_iklim');
    }
};
