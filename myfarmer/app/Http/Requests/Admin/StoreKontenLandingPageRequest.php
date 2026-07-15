<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreKontenLandingPageRequest extends FormRequest
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
            'judul'        => ['required', 'string', 'max:255'],
            'isi'          => ['required', 'string', 'min:10'],
            'tipe'         => ['required', 'in:pengumuman,tips'],
            'is_active'    => ['sometimes', 'boolean'],
            'urutan_tampil' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    /**
     * Custom validation messages (Bahasa Indonesia).
     */
    public function messages(): array
    {
        return [
            'judul.required'        => 'Judul konten wajib diisi.',
            'judul.max'             => 'Judul konten maksimal 255 karakter.',
            'isi.required'          => 'Isi konten wajib diisi.',
            'isi.min'               => 'Isi konten minimal 10 karakter.',
            'tipe.required'         => 'Tipe konten wajib dipilih.',
            'tipe.in'               => 'Tipe konten harus berupa: pengumuman atau tips.',
            'is_active.boolean'     => 'Status aktif harus berupa true/false.',
            'urutan_tampil.integer' => 'Urutan tampil harus berupa angka.',
            'urutan_tampil.min'     => 'Urutan tampil tidak boleh negatif.',
        ];
    }
}
