<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rules\File;

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
        $konten = $this->route('konten_landing_page');
        $tipe = $this->input('tipe', $konten?->tipe);
        $tipeBerubah = $konten && $tipe !== $konten->tipe;
        $fileWajib = in_array($tipe, ['sorotan', 'poster', 'pdf'], true)
            && ($tipeBerubah || ! $konten?->path_file);
        $isiWajib = in_array($tipe, ['pengumuman', 'tips'], true)
            && ($tipeBerubah || ! $konten?->isi);

        return [
            'judul' => ['sometimes', 'string', 'max:255'],
            'isi' => in_array($tipe, ['pengumuman', 'tips'], true)
                ? [$isiWajib ? 'required' : 'sometimes', 'string', 'min:10']
                : ['nullable', 'string', 'min:10'],
            'tipe' => ['sometimes', 'in:pengumuman,tips,sorotan,poster,pdf'],
            'file_media' => $this->mediaFileRules($tipe, $fileWajib),
            'thumbnail' => in_array($tipe, ['sorotan', 'pdf'], true)
                ? ['nullable', File::types(['jpg', 'jpeg', 'png', 'webp'])->max(5 * 1024)]
                : ['prohibited'],
            'hapus_thumbnail' => in_array($tipe, ['sorotan', 'pdf'], true)
                ? ['sometimes', 'boolean']
                : ['prohibited'],
            'url_sumber' => in_array($tipe, ['poster', 'pdf'], true)
                ? ['sometimes', 'nullable', 'string', 'max:2048', $this->httpUrlRule()]
                : ['nullable', 'string', 'max:2048', $this->httpUrlRule()],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'urutan_tampil' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    private function mediaFileRules(?string $tipe, bool $required): array
    {
        if (! in_array($tipe, ['sorotan', 'poster', 'pdf'], true)) {
            return ['prohibited'];
        }

        $types = $tipe === 'sorotan'
            ? ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm']
            : ($tipe === 'poster' ? ['jpg', 'jpeg', 'png', 'webp'] : ['pdf']);
        $maxKilobytes = $tipe === 'sorotan' ? 50 * 1024 : ($tipe === 'pdf' ? 20 * 1024 : 10 * 1024);

        return [$required ? 'required' : 'nullable', File::types($types)->max($maxKilobytes)];
    }

    private function httpUrlRule(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail): void {
            if ($value === null || $value === '') {
                return;
            }

            $scheme = strtolower((string) parse_url((string) $value, PHP_URL_SCHEME));
            if (! filter_var($value, FILTER_VALIDATE_URL) || ! in_array($scheme, ['http', 'https'], true)) {
                $fail('URL sumber harus berupa alamat HTTP atau HTTPS yang valid.');
            }
        };
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status' => 'error',
            'message' => 'Terjadi kesalahan validasi.',
            'errors' => $validator->errors(),
        ], 422));
    }

    /**
     * Custom validation messages (Bahasa Indonesia).
     */
    public function messages(): array
    {
        return [
            'judul.max' => 'Judul konten maksimal 255 karakter.',
            'isi.min' => 'Isi konten minimal 10 karakter.',
            'tipe.in' => 'Tipe konten tidak didukung.',
            'file_media.required' => 'File media wajib diunggah.',
            'file_media.prohibited' => 'File media tidak boleh diunggah untuk konten teks.',
            'is_active.boolean' => 'Status aktif harus berupa true/false.',
            'urutan_tampil.integer' => 'Urutan tampil harus berupa angka.',
            'urutan_tampil.min' => 'Urutan tampil tidak boleh negatif.',
        ];
    }
}
