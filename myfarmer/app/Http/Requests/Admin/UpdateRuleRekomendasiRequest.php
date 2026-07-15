<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRuleRekomendasiRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Otorisasi granular dihandle di controller (admin vs super_admin field restrictions)
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * Admin hanya boleh mengubah 'parameter' dan 'is_active'.
     * Super_admin boleh mengubah semua field.
     * Pembatasan field dilakukan di controller, bukan di sini — validasi
     * di sini menerima semua kemungkinan field, controller yang memfilter.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'nama_rule'  => ['sometimes', 'string', 'max:255'],
            'deskripsi'  => ['sometimes', 'nullable', 'string'],
            'parameter'  => ['sometimes', 'array'],
            'parameter.min_curah_hujan_dasarian' => ['required_with:parameter', 'numeric', 'min:0'],
            'parameter.min_dasarian_berturut'    => ['required_with:parameter', 'integer', 'min:1', 'max:36'],
            'is_active'  => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Custom validation messages (Bahasa Indonesia).
     */
    public function messages(): array
    {
        return [
            'nama_rule.max'                               => 'Nama rule maksimal 255 karakter.',
            'parameter.array'                             => 'Parameter harus berupa objek JSON.',
            'parameter.min_curah_hujan_dasarian.required_with' => 'min_curah_hujan_dasarian wajib diisi jika parameter diubah.',
            'parameter.min_curah_hujan_dasarian.numeric'  => 'min_curah_hujan_dasarian harus berupa angka.',
            'parameter.min_curah_hujan_dasarian.min'      => 'min_curah_hujan_dasarian tidak boleh negatif.',
            'parameter.min_dasarian_berturut.required_with' => 'min_dasarian_berturut wajib diisi jika parameter diubah.',
            'parameter.min_dasarian_berturut.integer'     => 'min_dasarian_berturut harus berupa bilangan bulat.',
            'parameter.min_dasarian_berturut.min'         => 'min_dasarian_berturut minimal 1.',
            'parameter.min_dasarian_berturut.max'         => 'min_dasarian_berturut maksimal 36.',
        ];
    }
}
