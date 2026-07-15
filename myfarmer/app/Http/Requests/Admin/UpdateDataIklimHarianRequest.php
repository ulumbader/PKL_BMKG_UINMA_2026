<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDataIklimHarianRequest extends FormRequest
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
        $dataId = $this->route('data_iklim_harian');

        return [
            'stasiun_id'     => ['sometimes', 'exists:stasiun_iklim,id'],
            'tanggal'        => [
                'sometimes',
                'date',
                'before_or_equal:today',
                Rule::unique('data_iklim_harian')->where(function ($query) {
                    return $query->where('stasiun_id', $this->input('stasiun_id', $this->resolveStasiunId()));
                })->ignore($dataId),
            ],
            'curah_hujan_mm' => ['nullable', 'numeric', 'min:0', 'max:999999.9'],
            'kode_status'    => ['sometimes', 'in:normal,tidak_terukur,tidak_ada_data'],
        ];
    }

    /**
     * Ambil stasiun_id dari record yang sedang diupdate jika tidak disertakan di request body.
     */
    private function resolveStasiunId(): ?int
    {
        $dataId = $this->route('data_iklim_harian');
        $record = \App\Models\DataIklimHarian::find($dataId);

        return $record?->stasiun_id;
    }

    /**
     * Custom validation messages (Bahasa Indonesia).
     */
    public function messages(): array
    {
        return [
            'stasiun_id.exists'       => 'Stasiun tidak ditemukan.',
            'tanggal.date'            => 'Format tanggal tidak valid.',
            'tanggal.before_or_equal' => 'Tanggal tidak boleh lebih dari hari ini.',
            'tanggal.unique'          => 'Data untuk stasiun dan tanggal tersebut sudah ada.',
            'curah_hujan_mm.numeric'  => 'Curah hujan harus berupa angka.',
            'curah_hujan_mm.min'      => 'Curah hujan tidak boleh negatif.',
            'curah_hujan_mm.max'      => 'Curah hujan melebihi batas maksimal.',
            'kode_status.in'          => 'Kode status tidak valid. Pilih: normal, tidak_terukur, atau tidak_ada_data.',
        ];
    }
}
