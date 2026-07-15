<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Seed akun super_admin awal untuk development.
     *
     * KREDENSIAL DEV (lihat juga CHANGELOG.md Tahap 3):
     *   Email:    superadmin@myfarmer.test
     *   Password: password123
     *
     * JANGAN gunakan kredensial ini di production!
     */
    public function run(): void
    {
        $superAdminRole = Role::where('nama_role', 'super_admin')->first();

        User::create([
            'role_id'       => $superAdminRole->id,
            'nama_lengkap'  => 'Super Admin MyFarmer',
            'email'         => 'superadmin@myfarmer.test',
            'password'      => 'password123', // akan di-hash otomatis oleh cast 'hashed'
            'is_active'     => true,
        ]);
    }
}
