<?php

namespace App\Http\Requests\Admin;

use App\Models\DataIklimHarian;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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

    /**
     * Pastikan setiap dasarian yang akan diproses memiliki data harian sumber.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $stasiunId = (int) $this->input('stasiun_id');
            $tahun = (int) $this->input('tahun');
            $bulan = (int) $this->input('bulan');
            $dasarianInput = $this->input('dasarian_ke');
            $dasarianList = $dasarianInput === null
                ? [1, 2, 3]
                : [(int) $dasarianInput];
            $dasarianKosong = [];

            foreach ($dasarianList as $dasarianKe) {
                [$tanggalMulai, $tanggalSelesai] = $this->rentangDasarian($tahun, $bulan, $dasarianKe);

                $tersedia = DataIklimHarian::query()
                    ->where('stasiun_id', $stasiunId)
                    ->whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
                    ->exists();

                if (!$tersedia) {
                    $dasarianKosong[] = $dasarianKe;
                }
            }

            if ($dasarianKosong !== []) {
                $daftar = implode(', ', $dasarianKosong);
                $validator->errors()->add(
                    $dasarianInput === null ? 'bulan' : 'dasarian_ke',
                    "Data iklim harian untuk dasarian {$daftar} pada bulan {$bulan}/{$tahun} tidak tersedia."
                );
            }
        });
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function rentangDasarian(int $tahun, int $bulan, int $dasarianKe): array
    {
        $hariMulai = match ($dasarianKe) {
            1 => 1,
            2 => 11,
            3 => 21,
        };
        $hariSelesai = match ($dasarianKe) {
            1 => 10,
            2 => 20,
            3 => Carbon::create($tahun, $bulan, 1)->endOfMonth()->day,
        };

        return [
            sprintf('%04d-%02d-%02d', $tahun, $bulan, $hariMulai),
            sprintf('%04d-%02d-%02d', $tahun, $bulan, $hariSelesai),
        ];
    }
}
