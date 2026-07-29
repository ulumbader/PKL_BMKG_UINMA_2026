<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE konten_landing_page MODIFY isi TEXT NULL');
            DB::statement('ALTER TABLE konten_landing_page MODIFY tipe VARCHAR(30) NOT NULL');
        }

        Schema::table('konten_landing_page', function (Blueprint $table) {
            $table->string('jenis_media', 20)->nullable()->after('tipe');
            $table->string('path_file')->nullable()->after('jenis_media');
            $table->string('path_thumbnail')->nullable()->after('path_file');
            $table->string('url_sumber', 2048)->nullable()->after('path_thumbnail');
            $table->string('alt_text')->nullable()->after('url_sumber');
            $table->index(['tipe', 'is_active', 'urutan_tampil'], 'idx_konten_tipe_active_urutan');
        });
    }

    public function down(): void
    {
        DB::table('konten_landing_page')
            ->whereIn('tipe', ['sorotan', 'poster', 'pdf'])
            ->delete();

        Schema::table('konten_landing_page', function (Blueprint $table) {
            $table->dropIndex('idx_konten_tipe_active_urutan');
            $table->dropColumn([
                'jenis_media',
                'path_file',
                'path_thumbnail',
                'url_sumber',
                'alt_text',
            ]);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE konten_landing_page MODIFY tipe ENUM('pengumuman', 'tips') NOT NULL");
            DB::statement('ALTER TABLE konten_landing_page MODIFY isi TEXT NOT NULL');
        }
    }
};
