<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validasi request untuk generate ringkasan AI.
 *
 * Field yang divalidasi:
 *   - hasil_rekomendasi_id: wajib, integer, harus ada di tabel hasil_rekomendasi
 */
class GenerateRingkasanRequest extends FormRequest
{
    /**
     * Hanya admin dan super_admin yang boleh generate ringkasan.
     */
    public function authorize(): bool
    {
        return true; // Sudah dijaga oleh middleware auth:sanctum + role:admin
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'hasil_rekomendasi_id' => [
                'required',
                'integer',
                'exists:hasil_rekomendasi,id',
            ],
        ];
    }

    /**
     * Pesan validasi khusus.
     */
    public function messages(): array
    {
        return [
            'hasil_rekomendasi_id.required' => 'ID hasil rekomendasi wajib diisi.',
            'hasil_rekomendasi_id.integer'  => 'ID hasil rekomendasi harus berupa angka.',
            'hasil_rekomendasi_id.exists'   => 'Hasil rekomendasi dengan ID tersebut tidak ditemukan.',
        ];
    }
}
