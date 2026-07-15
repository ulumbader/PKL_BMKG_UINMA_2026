<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Modifikasi tabel users bawaan Laravel:
     * - Tambah role_id (FK ke roles), nama_lengkap, is_active, last_login
     * - Hapus kolom 'name' (diganti nama_lengkap) dan 'remember_token' (tidak dipakai, API-only)
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Tambah kolom baru
            $table->foreignId('role_id')->after('id')->constrained('roles')->onDelete('restrict');
            $table->string('nama_lengkap')->after('role_id');
            $table->boolean('is_active')->default(true)->after('password');
            $table->dateTime('last_login')->nullable()->after('is_active');

            // Hapus kolom yang tidak dipakai
            $table->dropColumn('name');
            $table->dropColumn('remember_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn(['role_id', 'nama_lengkap', 'is_active', 'last_login']);

            // Kembalikan kolom bawaan Laravel
            $table->string('name')->after('id');
            $table->rememberToken();
        });
    }
};
