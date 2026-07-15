"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";

import { Alert, Button, Card, Skeleton, Spinner } from "@/components/ui";
import { ApiError, apiGet, apiPost } from "@/lib/apiClient";

type AggregationRow = {
  id: number;
  stasiun_id: number;
  tahun: number;
  bulan: number;
  dasarian_ke: number;
  total_curah_hujan_mm: string | number | null;
  jumlah_hari_hujan: number;
  jumlah_hari_valid: number;
  jumlah_hari_missing: number;
  status_musim: "basah" | "normal" | "kering" | string;
  dihitung_pada?: string;
  stasiun?: { id?: number; kode_wmo?: string; nama_stasiun?: string };
};

type StasiunOption = {
  id: number;
  kode_wmo: string;
  nama_stasiun: string;
};

type AggregationPage = {
  current_page?: number;
  data?: AggregationRow[];
  total?: number;
  per_page?: number;
};

type FieldErrors = Record<string, string>;

type Filters = {
  stasiun_id: string;
  tahun: string;
  bulan: string;
  dasarian_ke: string;
  per_page: string;
};

type ProcessForm = {
  stasiun_id: string;
  tahun: string;
  bulan: string;
  dasarian_ke: string;
};

const emptyFilters: Filters = {
  stasiun_id: "",
  tahun: "",
  bulan: "",
  dasarian_ke: "",
  per_page: "50",
};

const emptyProcessForm: ProcessForm = {
  stasiun_id: "",
  tahun: "",
  bulan: "",
  dasarian_ke: "",
};

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const inputClass =
  "h-10 w-full rounded-control border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function buildQuery(filters: Filters) {
  const params = new URLSearchParams({ per_page: filters.per_page });

  for (const key of ["stasiun_id", "tahun", "bulan", "dasarian_ke"] as const) {
    if (filters[key]) params.set(key, filters[key]);
  }

  return params.toString();
}

function fieldErrors(errors: unknown): FieldErrors {
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) return {};

  return Object.fromEntries(
    Object.entries(errors as Record<string, unknown>).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map(String).join(" ") : String(value),
    ]),
  );
}

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof ApiError ? caught.message : fallback;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("id-ID");
}

function periodLabel(row: AggregationRow) {
  return `Dasarian ${row.dasarian_ke} - ${monthNames[row.bulan - 1] ?? `Bulan ${row.bulan}`} ${row.tahun}`;
}

function makeProcessPayload(form: ProcessForm) {
  const payload: Record<string, number> = {
    stasiun_id: Number(form.stasiun_id),
    tahun: Number(form.tahun),
    bulan: Number(form.bulan),
  };

  if (form.dasarian_ke) payload.dasarian_ke = Number(form.dasarian_ke);
  return payload;
}

export default function Page() {
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [reloadKey, setReloadKey] = useState(0);

  const [rows, setRows] = useState<AggregationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [notice, setNotice] = useState("");

  const [processForm, setProcessForm] = useState(emptyProcessForm);
  const [processErrors, setProcessErrors] = useState<FieldErrors>({});
  const [processing, setProcessing] = useState(false);

  const [stasiunOptions, setStasiunOptions] = useState<StasiunOption[]>([]);
  const [tahunOptions, setTahunOptions] = useState<number[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setOptionsLoading(true);
      try {
        const response = await apiGet<StasiunOption[]>("/admin/stasiun");
        if (!active) return;
        const stations = response.data ?? [];
        const tahunSet = new Set<number>();
        try {
          const agResponse = await apiGet<AggregationPage>("/admin/agregasi?per_page=200");
          if (!active) return;
          const agRows = agResponse.data.data ?? [];
          for (const row of agRows) {
            if (row.tahun) tahunSet.add(row.tahun);
          }
        } catch { /* ignore secondary fetch failure */ }
        setStasiunOptions(stations.sort((a, b) => a.nama_stasiun.localeCompare(b.nama_stasiun)));
        setTahunOptions(Array.from(tahunSet).sort((a, b) => b - a));
      } catch {
        if (!active) return;
        setStasiunOptions([]);
        setTahunOptions([]);
      } finally {
        if (active) setOptionsLoading(false);
      }
    }

    loadOptions();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadRows() {
      setLoading(true);
      setTableError("");

      try {
        const response = await apiGet<AggregationPage>(
          `/admin/agregasi?${buildQuery(appliedFilters)}`,
        );

        if (!active) return;
        const data = response.data.data ?? [];
        setRows(data);
        setTotal(response.data.total ?? data.length);
      } catch (caught) {
        if (!active) return;
        setRows([]);
        setTotal(0);
        setTableError(errorMessage(caught, "Data agregasi gagal dimuat."));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRows();

    return () => {
      active = false;
    };
  }, [appliedFilters, reloadKey]);

  function submitFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setAppliedFilters(filters);
  }

  async function submitProcess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProcessing(true);
    setNotice("");
    setTableError("");
    setProcessErrors({});

    try {
      const response = await apiPost<AggregationRow[]>(
        "/admin/agregasi/proses",
        makeProcessPayload(processForm),
      );

      setNotice(response.message);
      setReloadKey((value) => value + 1);
    } catch (caught) {
      setProcessErrors(caught instanceof ApiError ? fieldErrors(caught.errors) : {});
      setTableError(errorMessage(caught, "Proses agregasi gagal."));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Agregasi Dasarian</h1>
        <p className="mt-1 text-sm text-muted">
          Proses dan lihat ringkasan curah hujan per dasarian.
        </p>
      </div>

      {notice ? <Alert variant="success">{notice}</Alert> : null}
      {tableError ? <Alert variant="error">{tableError}</Alert> : null}

      <Card>
        <form onSubmit={submitProcess} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Proses Agregasi</h2>
            <p className="mt-1 text-sm text-muted">
              Kosongkan dasarian ke untuk memproses 3 dasarian sekaligus.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-5 md:items-start">
            <Field label="Stasiun" error={processErrors.stasiun_id}>
              <select
                required
                className={inputClass}
                disabled={optionsLoading}
                value={processForm.stasiun_id}
                onChange={(event) => setProcessForm({ ...processForm, stasiun_id: event.target.value })}
              >
                <option value="">{optionsLoading ? "Memuat stasiun..." : "Pilih stasiun"}</option>
                {stasiunOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama_stasiun}{s.kode_wmo ? ` (WMO: ${s.kode_wmo})` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tahun" error={processErrors.tahun}>
              <select
                required
                className={inputClass}
                disabled={optionsLoading}
                value={processForm.tahun}
                onChange={(event) => setProcessForm({ ...processForm, tahun: event.target.value })}
              >
                <option value="">{optionsLoading ? "Memuat tahun..." : "Pilih tahun"}</option>
                {tahunOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </Field>
            <Field label="Bulan" error={processErrors.bulan}>
              <select
                required
                className={inputClass}
                value={processForm.bulan}
                onChange={(event) => setProcessForm({ ...processForm, bulan: event.target.value })}
              >
                <option value="">Pilih bulan</option>
                {monthNames.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
            </Field>
            <Field label="Dasarian Ke" error={processErrors.dasarian_ke}>
              <select
                className={inputClass}
                value={processForm.dasarian_ke}
                onChange={(event) => setProcessForm({ ...processForm, dasarian_ke: event.target.value })}
              >
                <option value="">Semua</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </Field>
            <Button type="submit" disabled={processing} className="md:mt-6">
              {processing ? <Spinner className="mr-2 size-4" label="Memproses" /> : null}
              Proses
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <form onSubmit={submitFilter} className="grid gap-3 md:grid-cols-6">
          <Field label="Stasiun">
            <select
              className={inputClass}
              disabled={optionsLoading}
              value={filters.stasiun_id}
              onChange={(event) => setFilters({ ...filters, stasiun_id: event.target.value })}
            >
              <option value="">{optionsLoading ? "Memuat stasiun..." : "Semua"}</option>
              {stasiunOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama_stasiun}{s.kode_wmo ? ` (WMO: ${s.kode_wmo})` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tahun">
            <select
              className={inputClass}
              disabled={optionsLoading}
              value={filters.tahun}
              onChange={(event) => setFilters({ ...filters, tahun: event.target.value })}
            >
              <option value="">{optionsLoading ? "Memuat tahun..." : "Semua"}</option>
              {tahunOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </Field>
          <Field label="Bulan">
            <select
              className={inputClass}
              value={filters.bulan}
              onChange={(event) => setFilters({ ...filters, bulan: event.target.value })}
            >
              <option value="">Semua</option>
              {monthNames.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>
          </Field>
          <Field label="Dasarian Ke">
            <select
              className={inputClass}
              value={filters.dasarian_ke}
              onChange={(event) => setFilters({ ...filters, dasarian_ke: event.target.value })}
            >
              <option value="">Semua</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </Field>
          <Field label="Per Halaman">
            <select
              className={inputClass}
              value={filters.per_page}
              onChange={(event) => setFilters({ ...filters, per_page: event.target.value })}
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </Field>
          <div className="flex items-end gap-2">
            <Button type="submit" className="flex-1">Filter</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFilters(emptyFilters);
                setAppliedFilters(emptyFilters);
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead className="border-b border-border bg-background text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Periode</th>
                <th className="px-4 py-3 font-medium">Stasiun</th>
                <th className="px-4 py-3 font-medium">Total Hujan</th>
                <th className="px-4 py-3 font-medium">Hari Hujan</th>
                <th className="px-4 py-3 font-medium">Valid/Missing</th>
                <th className="px-4 py-3 font-medium">Status Musim</th>
                <th className="px-4 py-3 font-medium">Dihitung Pada</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-border">
                    {Array.from({ length: 7 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length ? (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{periodLabel(row)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.stasiun?.nama_stasiun ?? `Stasiun ${row.stasiun_id}`}</div>
                      {row.stasiun?.kode_wmo ? <div className="text-xs text-muted">WMO {row.stasiun.kode_wmo}</div> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.total_curah_hujan_mm == null ? "-" : `${row.total_curah_hujan_mm} mm`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{row.jumlah_hari_hujan}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.jumlah_hari_valid} / {row.jumlah_hari_missing}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={row.status_musim} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDateTime(row.dihitung_pada)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    Belum ada data agregasi sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 text-sm text-muted">
          Total {total} data ditampilkan
        </div>
      </Card>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error ? <span className="block text-xs font-normal text-danger">{error}</span> : null}
    </label>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const value = status || "-";
  const colors: Record<string, string> = {
    basah: "border-primary/30 bg-success-subtle text-primary",
    normal: "border-wait/30 bg-warning-subtle text-wait",
    kering: "border-danger/30 bg-danger-subtle text-danger",
  };

  return (
    <span
      className={[
        "inline-flex rounded-control border px-2 py-1 text-xs font-medium capitalize",
        colors[value] ?? "border-border bg-background text-muted",
      ].join(" ")}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}

