<?php

namespace App\Http\Requests\Public;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class GrafikCurahHujanRequest extends FormRequest
{
    /**
     * Endpoint grafik dapat diakses publik tanpa autentikasi.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'jumlah_periode' => ['nullable', 'integer', 'min:1', 'max:36'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'jumlah_periode.integer' => 'Jumlah periode harus berupa bilangan bulat.',
            'jumlah_periode.min' => 'Jumlah periode minimal 1.',
            'jumlah_periode.max' => 'Jumlah periode maksimal 36.',
        ];
    }

    /**
     * Pertahankan kontrak response error standar untuk endpoint publik.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status' => 'error',
            'message' => 'Terjadi kesalahan validasi.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
