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
            'nama_rule' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'parameter' => ['required', 'array'],
            'parameter.min_curah_hujan_dasarian' => ['required', 'numeric', 'min:0'],
            'parameter.min_dasarian_berturut' => ['required', 'integer', 'min:1', 'max:36'],
            'parameter.total_alternatif_mm' => ['required', 'numeric', 'min:0'],
            'parameter.pakai_kriteria_hari_hujan' => ['required', 'boolean'],
            'parameter.min_hari_hujan_dasarian' => ['required', 'integer', 'min:1', 'max:11'],
            'parameter.mt1_bulan_mulai' => ['required', 'integer', 'min:1', 'max:12'],
            'parameter.mt1_dasarian_mulai' => ['required', 'integer', 'min:1', 'max:3'],
            'parameter.mt1_bulan_selesai' => ['required', 'integer', 'min:1', 'max:12'],
            'parameter.mt1_dasarian_selesai' => ['required', 'integer', 'min:1', 'max:3'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Custom validation messages (Bahasa Indonesia).
     */
    public function messages(): array
    {
        return [
            'nama_rule.required' => 'Nama rule wajib diisi.',
            'nama_rule.max' => 'Nama rule maksimal 255 karakter.',
            'parameter.required' => 'Parameter wajib diisi.',
            'parameter.array' => 'Parameter harus berupa objek JSON.',
            'parameter.min_curah_hujan_dasarian.required' => 'Parameter min_curah_hujan_dasarian wajib diisi.',
            'parameter.min_curah_hujan_dasarian.numeric' => 'min_curah_hujan_dasarian harus berupa angka.',
            'parameter.min_curah_hujan_dasarian.min' => 'min_curah_hujan_dasarian tidak boleh negatif.',
            'parameter.min_dasarian_berturut.required' => 'Parameter min_dasarian_berturut wajib diisi.',
            'parameter.min_dasarian_berturut.integer' => 'min_dasarian_berturut harus berupa bilangan bulat.',
            'parameter.min_dasarian_berturut.min' => 'min_dasarian_berturut minimal 1.',
            'parameter.min_dasarian_berturut.max' => 'min_dasarian_berturut maksimal 36.',
            'parameter.total_alternatif_mm.required' => 'Parameter total_alternatif_mm wajib diisi.',
            'parameter.total_alternatif_mm.numeric' => 'total_alternatif_mm harus berupa angka.',
            'parameter.total_alternatif_mm.min' => 'total_alternatif_mm tidak boleh negatif.',
            'parameter.pakai_kriteria_hari_hujan.required' => 'Parameter pakai_kriteria_hari_hujan wajib diisi.',
            'parameter.pakai_kriteria_hari_hujan.boolean' => 'pakai_kriteria_hari_hujan harus berupa boolean.',
            'parameter.min_hari_hujan_dasarian.required' => 'Parameter min_hari_hujan_dasarian wajib diisi.',
            'parameter.min_hari_hujan_dasarian.integer' => 'min_hari_hujan_dasarian harus berupa bilangan bulat.',
            'parameter.min_hari_hujan_dasarian.min' => 'min_hari_hujan_dasarian minimal 1.',
            'parameter.min_hari_hujan_dasarian.max' => 'min_hari_hujan_dasarian maksimal 11.',
            'parameter.mt1_bulan_mulai.required' => 'Bulan mulai MT1 wajib diisi.',
            'parameter.mt1_bulan_mulai.integer' => 'Bulan mulai MT1 harus berupa bilangan bulat.',
            'parameter.mt1_bulan_mulai.min' => 'Bulan mulai MT1 minimal 1.',
            'parameter.mt1_bulan_mulai.max' => 'Bulan mulai MT1 maksimal 12.',
            'parameter.mt1_dasarian_mulai.required' => 'Dasarian mulai MT1 wajib diisi.',
            'parameter.mt1_dasarian_mulai.integer' => 'Dasarian mulai MT1 harus berupa bilangan bulat.',
            'parameter.mt1_dasarian_mulai.min' => 'Dasarian mulai MT1 minimal 1.',
            'parameter.mt1_dasarian_mulai.max' => 'Dasarian mulai MT1 maksimal 3.',
            'parameter.mt1_bulan_selesai.required' => 'Bulan selesai MT1 wajib diisi.',
            'parameter.mt1_bulan_selesai.integer' => 'Bulan selesai MT1 harus berupa bilangan bulat.',
            'parameter.mt1_bulan_selesai.min' => 'Bulan selesai MT1 minimal 1.',
            'parameter.mt1_bulan_selesai.max' => 'Bulan selesai MT1 maksimal 12.',
            'parameter.mt1_dasarian_selesai.required' => 'Dasarian selesai MT1 wajib diisi.',
            'parameter.mt1_dasarian_selesai.integer' => 'Dasarian selesai MT1 harus berupa bilangan bulat.',
            'parameter.mt1_dasarian_selesai.min' => 'Dasarian selesai MT1 minimal 1.',
            'parameter.mt1_dasarian_selesai.max' => 'Dasarian selesai MT1 maksimal 3.',
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
