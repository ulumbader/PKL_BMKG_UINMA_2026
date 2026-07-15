<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Urutan PENTING — sesuai dependency:
     * 1. RoleSeeder (roles harus ada dulu sebelum user)
     * 2. AdminSeeder (user butuh role_id)
     * 3. StasiunIklimSeeder (independen, tapi diletakkan setelah user)
     * 4. RuleRekomendasiSeeder (butuh user super_admin dari AdminSeeder)
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            AdminSeeder::class,
            StasiunIklimSeeder::class,
            RuleRekomendasiSeeder::class,
        ]);
    }
}
