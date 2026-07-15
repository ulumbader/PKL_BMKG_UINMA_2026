<?php

/**
 * Konfigurasi khusus aplikasi MyFarmer.
 *
 * File ini menyimpan setting spesifik proyek yang tidak termasuk
 * dalam konfigurasi bawaan Laravel.
 */

return [

    /*
    |--------------------------------------------------------------------------
    | Kode ADM4 Default (Kecamatan Karangploso)
    |--------------------------------------------------------------------------
    |
    | Kode wilayah administratif level 4 (kelurahan/desa) yang digunakan
    | sebagai default untuk fetch prakiraan cuaca dari API BMKG.
    |
    | Format: "xx.xx.xx.xxxx" (prov.kotkab.kec.desa)
    |
    | TODO: Ganti placeholder ini dengan kode adm4 spesifik untuk
    |       salah satu desa/kelurahan di Kec. Karangploso, Kab. Malang.
    |       Cari kode yang benar melalui Portal Data Terbuka BMKG
    |       atau endpoint:
    |       https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode}
    |
    |       Kode kecamatan Karangploso di Kemendagri: 35.07.20
    |       Contoh format kode desa: 35.07.20.xxxx
    |
    */

    'kode_adm4_default' => env('BMKG_KODE_ADM4', '35.07.20.2001'),

    /*
    |--------------------------------------------------------------------------
    | BMKG API Configuration
    |--------------------------------------------------------------------------
    |
    | Base URL dan timeout untuk API publik prakiraan cuaca BMKG.
    |
    */

    'bmkg_api' => [
        'base_url' => env('BMKG_API_BASE_URL', 'https://api.bmkg.go.id/publik/prakiraan-cuaca'),
        'timeout'  => env('BMKG_API_TIMEOUT', 30),
    ],

];
