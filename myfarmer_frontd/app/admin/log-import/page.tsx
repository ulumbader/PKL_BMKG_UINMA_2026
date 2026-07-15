"use client";

import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";

import { Alert, Button, Card, Skeleton } from "@/components/ui";
import { ApiError, apiGet } from "@/lib/apiClient";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

type Paginated<T> = {
  data?: T[];
  total?: number;
  per_page?: number;
};

type ListResult<T> = T[] | Paginated<T>;

type LogRow = {
  id: number;
  sumber: string;
  status: string;
  jumlah_data_masuk: number;
  pesan_error?: string | null;
  waktu_mulai?: string;
  waktu_selesai?: string;
  triggered_by?: number;
  triggered_by_user?: { id: number; nama_lengkap: string } | null;
};

type Filters = {
  status: string;
  sumber: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  per_page: string;
};

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const emptyFilters: Filters = {
  status: "",
  sumber: "",
  tanggal_mulai: "",
  tanggal_selesai: "",
  per_page: "15",
};

const inputClass =
  "h-10 w-full rounded-control border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function listItems<T>(result: ListResult<T>) {
  return Array.isArray(result) ? result : result.data ?? [];
}

function listTotal<T>(result: ListResult<T>) {
  return Array.isArray(result) ? result.length : result.total ?? result.data?.length ?? 0;
}

function buildQuery(filters: Filters) {
  const params = new URLSearchParams({ per_page: filters.per_page });
  if (filters.status) params.set("status", filters.status);
  if (filters.sumber) params.set("sumber", filters.sumber);
  if (filters.tanggal_mulai) params.set("tanggal_mulai", filters.tanggal_mulai);
  if (filters.tanggal_selesai) params.set("tanggal_selesai", filters.tanggal_selesai);
  return params.toString();
}

function errorMessage(caught: unknown, fallback: string) {
  if (!(caught instanceof ApiError)) return fallback;
  return caught.message;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("id-ID");
}

/* ────────────────────────────────────────────
   Main Page
   ──────────────────────────────────────────── */

export default function Page() {
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);

  const [rows, setRows] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ──────────────── Data Fetching ──────────────── */

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await apiGet<ListResult<LogRow>>(
          `/admin/log-import?${buildQuery(appliedFilters)}`,
        );
        if (!active) return;
        setRows(listItems(response.data));
        setTotal(listTotal(response.data));
      } catch (caught) {
        if (!active) return;
        setRows([]);
        setTotal(0);
        setError(errorMessage(caught, "Log import gagal dimuat."));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [appliedFilters]);

  const submitFilter = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters(filters);
  }, [filters]);

  /* ──────────────── Render ──────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Log Import</h1>
        <p className="mt-1 text-sm text-muted">Histori import data dari BMKG (read-only).</p>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {/* ──────── Filters ──────── */}
      <Card>
        <form onSubmit={submitFilter} className="grid gap-3 md:grid-cols-6">
          <Field label="Status">
            <select
              className={inputClass}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Semua</option>
              <option value="sukses">Sukses</option>
              <option value="gagal">Gagal</option>
            </select>
          </Field>
          <Field label="Sumber">
            <input
              className={inputClass}
              value={filters.sumber}
              onChange={(e) => setFilters({ ...filters, sumber: e.target.value })}
              placeholder="import_csv"
            />
          </Field>
          <Field label="Dari Tanggal">
            <input
              className={inputClass}
              type="date"
              value={filters.tanggal_mulai}
              onChange={(e) => setFilters({ ...filters, tanggal_mulai: e.target.value })}
            />
          </Field>
          <Field label="Sampai Tanggal">
            <input
              className={inputClass}
              type="date"
              value={filters.tanggal_selesai}
              onChange={(e) => setFilters({ ...filters, tanggal_selesai: e.target.value })}
            />
          </Field>
          <Field label="Per Halaman">
            <select
              className={inputClass}
              value={filters.per_page}
              onChange={(e) => setFilters({ ...filters, per_page: e.target.value })}
            >
              <option value="15">15</option>
              <option value="50">50</option>
              <option value="100">100</option>
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

      {/* ──────── Table ──────── */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="border-b border-border bg-background text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Sumber</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data Masuk</th>
                <th className="px-4 py-3 font-medium">Pesan Error</th>
                <th className="px-4 py-3 font-medium">Mulai</th>
                <th className="px-4 py-3 font-medium">Selesai</th>
                <th className="px-4 py-3 font-medium">Oleh</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, ri) => (
                  <tr key={ri} className="border-b border-border">
                    {Array.from({ length: 8 }).map((__, ci) => (
                      <td key={ci} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length ? (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{row.id}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <code className="rounded bg-background px-1.5 py-0.5 text-xs">{row.sumber}</code>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">{row.jumlah_data_masuk}</td>
                    <td className="max-w-xs px-4 py-3 text-xs text-muted">
                      {row.pesan_error || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDateTime(row.waktu_mulai)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDateTime(row.waktu_selesai)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.triggered_by_user?.nama_lengkap ?? `-`}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    Belum ada log import sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 text-sm text-muted">
          Total {total} log ditampilkan
        </div>
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const colors: Record<string, string> = {
    sukses: "border-primary/30 bg-success-subtle text-primary",
    gagal: "border-danger/30 bg-danger-subtle text-danger",
  };

  return (
    <span
      className={[
        "inline-flex rounded-control border px-2 py-1 text-xs font-medium capitalize",
        colors[status || ""] ?? "border-border bg-background text-muted",
      ].join(" ")}
    >
      {status || "-"}
    </span>
  );
}
