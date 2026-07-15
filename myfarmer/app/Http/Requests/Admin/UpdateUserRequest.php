<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Otorisasi ditangani oleh middleware role:super_admin
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        $userId = $this->route('user');

        return [
            'nama_lengkap' => ['sometimes', 'string', 'max:255'],
            'email'        => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'password'     => ['sometimes', 'string', 'min:8'],
            'role_id'      => ['sometimes', 'exists:roles,id'],
            'is_active'    => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Custom validation messages (Bahasa Indonesia).
     */
    public function messages(): array
    {
        return [
            'email.email'    => 'Format email tidak valid.',
            'email.unique'   => 'Email sudah terdaftar.',
            'password.min'   => 'Password minimal 8 karakter.',
            'role_id.exists' => 'Role tidak valid.',
            'is_active.boolean' => 'Format is_active tidak valid.',
        ];
    }
}
