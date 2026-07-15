<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Konten landing page (pengumuman/tips) yang dikelola admin.
     */
    public function up(): void
    {
        Schema::create('konten_landing_page', function (Blueprint $table) {
            $table->id();
            $table->string('judul');
            $table->text('isi');
            $table->enum('tipe', ['pengumuman', 'tips']);
            $table->boolean('is_active')->default(true);
            $table->integer('urutan_tampil')->default(0);
            $table->foreignId('dibuat_oleh')->constrained('users')->onDelete('restrict');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('konten_landing_page');
    }
};
