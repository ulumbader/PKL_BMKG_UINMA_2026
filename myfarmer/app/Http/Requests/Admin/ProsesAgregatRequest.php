<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ProsesAgregatRequest extends FormRequest
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
            'stasiun_id'  => ['required', 'exists:stasiun_iklim,id'],
            'tahun'       => ['required', 'integer', 'min:1900', 'max:2100'],
            'bulan'       => ['required', 'integer', 'min:1', 'max:12'],
            'dasarian_ke' => ['nullable', 'integer', 'in:1,2,3'],
        ];
    }

    /**
     * Custom validation messages (Bahasa Indonesia).
     */
    public function messages(): array
    {
        return [
            'stasiun_id.required'  => 'Stasiun wajib dipilih.',
            'stasiun_id.exists'    => 'Stasiun tidak ditemukan.',
            'tahun.required'       => 'Tahun wajib diisi.',
            'tahun.integer'        => 'Tahun harus berupa angka.',
            'tahun.min'            => 'Tahun tidak valid.',
            'tahun.max'            => 'Tahun tidak valid.',
            'bulan.required'       => 'Bulan wajib diisi.',
            'bulan.integer'        => 'Bulan harus berupa angka.',
            'bulan.min'            => 'Bulan harus antara 1-12.',
            'bulan.max'            => 'Bulan harus antara 1-12.',
            'dasarian_ke.integer'  => 'Dasarian harus berupa angka.',
            'dasarian_ke.in'       => 'Dasarian harus 1, 2, atau 3.',
        ];
    }
}
