<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ImportCsvRequest extends FormRequest
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
            'file'       => ['required', 'file', 'mimes:csv,txt', 'max:5120'], // max 5MB (5120 KB)
            'stasiun_id' => ['required', 'exists:stasiun_iklim,id'],
        ];
    }

    /**
     * Custom validation messages (Bahasa Indonesia).
     */
    public function messages(): array
    {
        return [
            'file.required'     => 'File CSV wajib diunggah.',
            'file.file'         => 'Input harus berupa file.',
            'file.mimes'        => 'File harus berformat CSV (.csv).',
            'file.max'          => 'Ukuran file maksimal 5MB.',
            'stasiun_id.required' => 'Stasiun wajib dipilih.',
            'stasiun_id.exists'   => 'Stasiun tidak ditemukan.',
        ];
    }
}
