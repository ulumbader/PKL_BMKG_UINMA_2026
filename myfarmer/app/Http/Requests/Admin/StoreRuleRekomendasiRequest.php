<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreRuleRekomendasiRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Hanya super_admin yang boleh membuat rule baru.
        // Pengecekan ini di DALAM form request sebagai lapisan tambahan
        // di atas middleware route (defence in depth).
        return $this->user() && $this->user()->hasRole('super_admin');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'nama_rule'  => ['required', 'string', 'max:255'],
            'deskripsi'  => ['nullable', 'string'],
            'parameter'  => ['required', 'array'],
            'parameter.min_curah_hujan_dasarian' => ['required', 'numeric', 'min:0'],
            'parameter.min_dasarian_berturut'    => ['required', 'integer', 'min:1', 'max:36'],
            'is_active'  => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Custom validation messages (Bahasa Indonesia).
     */
    public function messages(): array
    {
        return [
            'nama_rule.required'                          => 'Nama rule wajib diisi.',
            'nama_rule.max'                               => 'Nama rule maksimal 255 karakter.',
            'parameter.required'                          => 'Parameter wajib diisi.',
            'parameter.array'                             => 'Parameter harus berupa objek JSON.',
            'parameter.min_curah_hujan_dasarian.required' => 'Parameter min_curah_hujan_dasarian wajib diisi.',
            'parameter.min_curah_hujan_dasarian.numeric'  => 'min_curah_hujan_dasarian harus berupa angka.',
            'parameter.min_curah_hujan_dasarian.min'      => 'min_curah_hujan_dasarian tidak boleh negatif.',
            'parameter.min_dasarian_berturut.required'    => 'Parameter min_dasarian_berturut wajib diisi.',
            'parameter.min_dasarian_berturut.integer'     => 'min_dasarian_berturut harus berupa bilangan bulat.',
            'parameter.min_dasarian_berturut.min'         => 'min_dasarian_berturut minimal 1.',
            'parameter.min_dasarian_berturut.max'         => 'min_dasarian_berturut maksimal 36.',
        ];
    }

    /**
     * Custom response saat authorize() gagal.
     */
    protected function failedAuthorization()
    {
        throw new \Illuminate\Auth\Access\AuthorizationException(
            'Hanya super_admin yang boleh membuat rule baru.'
        );
    }
}
