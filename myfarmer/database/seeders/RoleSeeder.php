<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Seed tabel roles dengan 2 role dasar.
     */
    public function run(): void
    {
        Role::insert([
            [
                'nama_role' => 'admin',
                'deskripsi' => 'Administrator — kelola data iklim, trigger agregasi & rule engine, kelola konten landing page',
            ],
            [
                'nama_role' => 'super_admin',
                'deskripsi' => 'Super Administrator — semua akses admin + kelola akun admin, ubah struktur rule, lihat audit log',
            ],
        ]);
    }
}
