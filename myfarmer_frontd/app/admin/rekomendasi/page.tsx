"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";

import { Alert, Button, Card, Skeleton, Spinner } from "@/components/ui";
import { ApiError, apiGet, apiGetAllPages, apiPost } from "@/lib/apiClient";

type Paginated<T> = {
  data?: T[];
  total?: number;
  per_page?: number;
};

type ListResult<T> = T[] | Paginated<T>;

type AggregationOption = {
  id: number;
  stasiun_id: number;
  tahun: number;
  bulan: number;
  dasarian_ke: number;
  stasiun?: { nama_stasiun?: string; kode_wmo?: string };
};

type RecommendationRow = {
  id: number;
  dasarian_id: number;
  rule_id: number;
  status_rekomendasi: "optimal_tanam" | "tunggu" | "tidak_disarankan" | string;
  catatan_teknis?: string;
  generated_at?: string;
  rule?: { nama_rule?: string; nama?: string };
  dasarian?: AggregationOption;
};

type FieldErrors = Record<string, string>;

type RuleOption = {
  id: number;
  nama_rule: string;
};

type Filters = {
  dasarian_id: string;
  rule_id: string;
  status_rekomendasi: string;
  per_page: string;
};

const emptyFilters: Filters = {
  dasarian_id: "",
  rule_id: "",
  status_rekomendasi: "",
  per_page: "50",
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

function listItems<T>(result: ListResult<T>) {
  return Array.isArray(result) ? result : result.data ?? [];
}

function listTotal<T>(result: ListResult<T>) {
  return Array.isArray(result) ? result.length : result.total ?? result.data?.length ?? 0;
}

function buildQuery(filters: Filters) {
  const params = new URLSearchParams({ per_page: filters.per_page });

  for (const key of ["dasarian_id", "rule_id", "status_rekomendasi"] as const) {
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
  if (!(caught instanceof ApiError)) return fallback;
  if (caught.statusCode === 403) return "Aksi ini tidak diizinkan untuk user saat ini.";
  return caught.message;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("id-ID");
}

function dasarianLabel(item: AggregationOption) {
  const month = monthNames[item.bulan - 1] ?? `Bulan ${item.bulan}`;
  const station = item.stasiun?.nama_stasiun ?? `Stasiun ${item.stasiun_id}`;
  return `ID ${item.id} - Dasarian ${item.dasarian_ke} ${month} ${item.tahun} - ${station}`;
}

function statusText(status?: string) {
  return (status || "-").replace(/_/g, " ");
}

export default function Page() {
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [reloadKey, setReloadKey] = useState(0);

  const [rows, setRows] = useState<RecommendationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [dasarianOptions, setDasarianOptions] = useState<AggregationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [evaluationDasarianId, setEvaluationDasarianId] = useState("");
  const [evaluationErrors, setEvaluationErrors] = useState<FieldErrors>({});
  const [evaluating, setEvaluating] = useState(false);

  const [ruleOptions, setRuleOptions] = useState<RuleOption[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadRules() {
      setRulesLoading(true);
      try {
        const response = await apiGet<ListResult<RuleOption>>("/admin/rules");
        if (!active) return;
        setRuleOptions(listItems(response.data));
      } catch {
        if (!active) return;
        setRuleOptions([]);
      } finally {
        if (active) setRulesLoading(false);
      }
    }

    loadRules();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setOptionsLoading(true);

      try {
        const options = await apiGetAllPages<AggregationOption>("/admin/agregasi?per_page=200");
        if (!active) return;
        setDasarianOptions(options);
      } catch {
        if (!active) return;
        setDasarianOptions([]);
      } finally {
        if (active) setOptionsLoading(false);
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadRows() {
      setLoading(true);
      setError("");

      try {
        const response = await apiGet<ListResult<RecommendationRow>>(
          `/admin/rekomendasi?${buildQuery(appliedFilters)}`,
        );
        if (!active) return;
        setRows(listItems(response.data));
        setTotal(listTotal(response.data));
      } catch (caught) {
        if (!active) return;
        setRows([]);
        setTotal(0);
        setError(errorMessage(caught, "Histori rekomendasi gagal dimuat."));
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

  async function submitEvaluation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    setEvaluationErrors({});

    if (!evaluationDasarianId) {
      setEvaluationErrors({ dasarian_id: "Dasarian wajib dipilih." });
      return;
    }

    setEvaluating(true);

    try {
      const response = await apiPost<RecommendationRow[]>("/admin/rekomendasi/evaluasi", {
        dasarian_id: Number(evaluationDasarianId),
      });
      setNotice(response.message);
      setReloadKey((value) => value + 1);
    } catch (caught) {
      setEvaluationErrors(caught instanceof ApiError ? fieldErrors(caught.errors) : {});
      setError(errorMessage(caught, "Evaluasi rekomendasi gagal."));
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Rekomendasi</h1>
        <p className="mt-1 text-sm text-muted">Evaluasi rule engine dan lihat histori hasil rekomendasi.</p>
      </div>

      {notice ? <Alert variant="success">{notice}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <Card>
        <form onSubmit={submitEvaluation} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Evaluasi Dasarian</h2>
            <p className="mt-1 text-sm text-muted">Pilih hasil agregasi dasarian yang akan dievaluasi.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
            <Field label="Dasarian" error={evaluationErrors.dasarian_id}>
              <select
                required
                className={inputClass}
                disabled={optionsLoading}
                value={evaluationDasarianId}
                onChange={(event) => setEvaluationDasarianId(event.target.value)}
              >
                <option value="">{optionsLoading ? "Memuat dasarian..." : "Pilih dasarian"}</option>
                {dasarianOptions.map((item) => (
                  <option key={item.id} value={item.id}>{dasarianLabel(item)}</option>
                ))}
              </select>
            </Field>
            <Button type="submit" disabled={evaluating || optionsLoading} className="md:mt-6">
              {evaluating ? <Spinner className="mr-2 size-4" label="Mengevaluasi" /> : null}
              Evaluasi
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <form onSubmit={submitFilter} className="grid gap-3 md:grid-cols-5">
          <Field label="Dasarian">
            <select
              className={inputClass}
              value={filters.dasarian_id}
              onChange={(event) => setFilters({ ...filters, dasarian_id: event.target.value })}
            >
              <option value="">Semua</option>
              {dasarianOptions.map((item) => (
                <option key={item.id} value={item.id}>{dasarianLabel(item)}</option>
              ))}
            </select>
          </Field>
          <Field label="Rule">
            <select
              className={inputClass}
              disabled={rulesLoading}
              value={filters.rule_id}
              onChange={(event) => setFilters({ ...filters, rule_id: event.target.value })}
            >
              <option value="">{rulesLoading ? "Memuat rule..." : "Semua"}</option>
              {ruleOptions.map((r) => (
                <option key={r.id} value={r.id}>{r.nama_rule}</option>
              ))}
            </select>
          </Field>
          <Field label="Status Rekomendasi">
            <select
              className={inputClass}
              value={filters.status_rekomendasi}
              onChange={(event) => setFilters({ ...filters, status_rekomendasi: event.target.value })}
            >
              <option value="">Semua</option>
              <option value="optimal_tanam">Optimal tanam</option>
              <option value="tunggu">Tunggu</option>
              <option value="tidak_disarankan">Tidak disarankan</option>
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
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="border-b border-border bg-background text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Dasarian</th>
                <th className="px-4 py-3 font-medium">Rule</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Catatan Teknis</th>
                <th className="px-4 py-3 font-medium">Generated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-border">
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : rows.length ? (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{row.id}</td>
                    <td className="px-4 py-3">
                      {row.dasarian ? dasarianLabel(row.dasarian) : `Dasarian ID ${row.dasarian_id}`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{row.rule?.nama_rule ?? row.rule?.nama ?? `Rule ${row.rule_id}`}</td>
                    <td className="whitespace-nowrap px-4 py-3"><RecommendationBadge status={row.status_rekomendasi} /></td>
                    <td className="max-w-md px-4 py-3 text-muted">{row.catatan_teknis ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDateTime(row.generated_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    Belum ada histori rekomendasi sesuai filter.
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

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error ? <span className="block text-xs font-normal text-danger">{error}</span> : null}
    </label>
  );
}

function RecommendationBadge({ status }: { status?: string }) {
  const colors: Record<string, string> = {
    optimal_tanam: "border-primary/30 bg-success-subtle text-primary",
    tunggu: "border-wait/30 bg-warning-subtle text-wait",
    tidak_disarankan: "border-danger/30 bg-danger-subtle text-danger",
  };

  return (
    <span
      className={[
        "inline-flex rounded-control border px-2 py-1 text-xs font-medium capitalize",
        colors[status || ""] ?? "border-border bg-background text-muted",
      ].join(" ")}
    >
      {statusText(status)}
    </span>
  );
}

