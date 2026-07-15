<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validasi request untuk update dan publish ringkasan AI.
 *
 * Field yang divalidasi:
 *   - ringkasan_text: opsional, string, min 10 karakter (agar ada isinya)
 *   - status: opsional, enum (draft/published)
 */
class UpdateRingkasanRequest extends FormRequest
{
    /**
     * Hanya admin dan super_admin yang boleh update/publish ringkasan.
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
            'ringkasan_text' => ['sometimes', 'required', 'string', 'min:10'],
            'status'         => ['sometimes', 'required', 'string', 'in:draft,published'],
        ];
    }

    /**
     * Pesan validasi khusus.
     */
    public function messages(): array
    {
        return [
            'ringkasan_text.required' => 'Teks ringkasan tidak boleh kosong.',
            'ringkasan_text.string'   => 'Teks ringkasan harus berupa teks.',
            'ringkasan_text.min'      => 'Teks ringkasan minimal 10 karakter.',
            'status.required'         => 'Status tidak boleh kosong.',
            'status.in'               => 'Status harus draft atau published.',
        ];
    }
}
