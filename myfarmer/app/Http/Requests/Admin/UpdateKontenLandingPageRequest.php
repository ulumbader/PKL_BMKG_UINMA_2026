<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateKontenLandingPageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Otorisasi ditangani oleh middleware role:admin
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'judul'         => ['sometimes', 'string', 'max:255'],
            'isi'           => ['sometimes', 'string', 'min:10'],
            'tipe'          => ['sometimes', 'in:pengumuman,tips'],
            'is_active'     => ['sometimes', 'boolean'],
            'urutan_tampil' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    /**
     * Custom validation messages (Bahasa Indonesia).
     */
    public function messages(): array
    {
        return [
            'judul.max'             => 'Judul konten maksimal 255 karakter.',
            'isi.min'               => 'Isi konten minimal 10 karakter.',
            'tipe.in'               => 'Tipe konten harus berupa: pengumuman atau tips.',
            'is_active.boolean'     => 'Status aktif harus berupa true/false.',
            'urutan_tampil.integer' => 'Urutan tampil harus berupa angka.',
            'urutan_tampil.min'     => 'Urutan tampil tidak boleh negatif.',
        ];
    }
}
