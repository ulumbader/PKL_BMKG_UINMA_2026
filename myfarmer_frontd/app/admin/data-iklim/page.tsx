"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";

import { Alert, Button, Card, Skeleton, Spinner } from "@/components/ui";
import { ApiError, apiDelete, apiGet, apiPost, apiPut } from "@/lib/apiClient";

type ClimateRow = {
  id: number;
  stasiun_id: number;
  tanggal: string;
  curah_hujan_mm: string | number | null;
  kode_status: string;
  sumber_data?: string;
  stasiun?: { id?: number; kode_wmo?: string; nama_stasiun?: string };
  dibuat_oleh?: { nama_lengkap?: string } | number | null;
};

type StasiunOption = {
  id: number;
  kode_wmo: string;
  nama_stasiun: string;
};

type ClimatePage = {
  current_page: number;
  data: ClimateRow[];
  total: number;
  per_page: number;
};

type FieldErrors = Record<string, string>;

type ClimateForm = {
  stasiun_id: string;
  tanggal: string;
  curah_hujan_mm: string;
  kode_status: string;
};

type Filters = {
  stasiun_id: string;
  tanggal: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  per_page: string;
};

type ImportResult = {
  ringkasan?: {
    sukses?: number;
    dilewati?: number;
    gagal?: number;
  };
};

const emptyFilters: Filters = {
  stasiun_id: "",
  tanggal: "",
  tanggal_mulai: "",
  tanggal_selesai: "",
  per_page: "15",
};

const emptyForm: ClimateForm = {
  stasiun_id: "",
  tanggal: "",
  curah_hujan_mm: "",
  kode_status: "normal",
};

const maxImportSize = 5 * 1024 * 1024;

const inputClass =
  "h-10 w-full rounded-control border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function todayValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function buildQuery(filters: Filters, page: number) {
  const params = new URLSearchParams({ page: String(page), per_page: filters.per_page });

  for (const key of ["stasiun_id", "tanggal", "tanggal_mulai", "tanggal_selesai"] as const) {
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

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    normal: "Normal",
    tidak_terukur: "Tidak terukur",
    tidak_ada_data: "Tidak ada data",
  };

  return labels[status ?? ""] ?? status ?? "-";
}

function makePayload(form: ClimateForm) {
  return {
    stasiun_id: Number(form.stasiun_id),
    tanggal: form.tanggal,
    curah_hujan_mm: form.curah_hujan_mm === "" ? null : Number(form.curah_hujan_mm),
    kode_status: form.kode_status || "normal",
  };
}

export default function Page() {
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [rows, setRows] = useState<ClimateRow[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, total: 0, per_page: 15 });
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [notice, setNotice] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClimateRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [importStationId, setImportStationId] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<FieldErrors>({});
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importResult, setImportResult] = useState<ImportResult["ringkasan"] | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [stasiunOptions, setStasiunOptions] = useState<StasiunOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadStasiunOptions() {
      setOptionsLoading(true);
      try {
        const response = await apiGet<StasiunOption[]>("/admin/stasiun");
        if (!active) return;
        const stations = response.data ?? [];
        setStasiunOptions(stations.sort((a, b) => a.nama_stasiun.localeCompare(b.nama_stasiun)));
      } catch {
        if (!active) return;
        setStasiunOptions([]);
      } finally {
        if (active) setOptionsLoading(false);
      }
    }

    loadStasiunOptions();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadRows() {
      setLoading(true);
      setTableError("");

      try {
        const response = await apiGet<ClimatePage>(
          `/admin/data-iklim?${buildQuery(appliedFilters, page)}`,
        );

        if (!active) return;
        setRows(response.data.data ?? []);
        setMeta({
          current_page: response.data.current_page ?? page,
          total: response.data.total ?? 0,
          per_page: response.data.per_page ?? Number(appliedFilters.per_page),
        });
      } catch (caught) {
        if (!active) return;
        setRows([]);
        setTableError(errorMessage(caught, "Data iklim gagal dimuat."));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRows();

    return () => {
      active = false;
    };
  }, [appliedFilters, page, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.per_page));
  const maxDate = todayValue();

  function refreshRows() {
    setReloadKey((value) => value + 1);
  }

  function openCreateForm() {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormMessage("");
    setFormOpen(true);
  }

  function openEditForm(row: ClimateRow) {
    setEditing(row);
    setForm({
      stasiun_id: String(row.stasiun_id),
      tanggal: row.tanggal,
      curah_hujan_mm: row.curah_hujan_mm == null ? "" : String(row.curah_hujan_mm),
      kode_status: row.kode_status || "normal",
    });
    setFormErrors({});
    setFormMessage("");
    setFormOpen(true);
  }

  async function submitFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setPage(1);
    setAppliedFilters(filters);
  }

  async function submitClimate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormErrors({});
    setFormMessage("");
    setNotice("");

    try {
      const response = editing
        ? await apiPut<ClimateRow>(`/admin/data-iklim/${editing.id}`, makePayload(form))
        : await apiPost<ClimateRow>("/admin/data-iklim", makePayload(form));

      setNotice(response.message);
      setFormOpen(false);
      refreshRows();
    } catch (caught) {
      setFormErrors(caught instanceof ApiError ? fieldErrors(caught.errors) : {});
      setFormMessage(errorMessage(caught, "Data iklim gagal disimpan."));
      setNotice("");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRow(row: ClimateRow) {
    if (!window.confirm(`Hapus data iklim tanggal ${row.tanggal}?`)) return;

    setDeletingId(row.id);
    setNotice("");

    try {
      const response = await apiDelete<null>(`/admin/data-iklim/${row.id}`);
      setNotice(response.message);
      refreshRows();
    } catch (caught) {
      setTableError(errorMessage(caught, "Data iklim gagal dihapus."));
    } finally {
      setDeletingId(null);
    }
  }

  async function submitImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImportErrors({});
    setImportMessage("");
    setImportResult(null);

    if (!importFile || !importStationId || importFile.size > maxImportSize) {
      setImportErrors({
        ...(!importStationId ? { stasiun_id: "Stasiun ID wajib diisi." } : {}),
        ...(!importFile ? { file: "File CSV wajib dipilih." } : {}),
        ...(importFile && importFile.size > maxImportSize ? { file: "File maksimal 5MB." } : {}),
      });
      return;
    }

    const body = new FormData();
    body.set("stasiun_id", importStationId);
    body.set("file", importFile);
    setImporting(true);

    try {
      const response = await apiPost<ImportResult>("/admin/data-iklim/import", body);
      setImportMessage(response.message);
      setImportResult(response.data.ringkasan ?? null);
      setImportFile(null);
      setFileInputKey((value) => value + 1);
      refreshRows();
    } catch (caught) {
      setImportErrors(caught instanceof ApiError ? fieldErrors(caught.errors) : {});
      setImportMessage(errorMessage(caught, "Import CSV gagal."));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Data Iklim Harian</h1>
          <p className="mt-1 text-sm text-muted">Kelola data hujan harian dan import CSV BMKG.</p>
        </div>
        <Button type="button" onClick={openCreateForm}>Input Data Manual</Button>
      </div>

      {notice ? <Alert variant="success">{notice}</Alert> : null}
      {tableError ? <Alert variant="error">{tableError}</Alert> : null}

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
          <Field label="Tanggal">
            <input
              className={inputClass}
              name="tanggal"
              type="date"
              value={filters.tanggal}
              onChange={(event) => setFilters({ ...filters, tanggal: event.target.value })}
            />
          </Field>
          <Field label="Tanggal Mulai">
            <input
              className={inputClass}
              name="tanggal_mulai"
              type="date"
              value={filters.tanggal_mulai}
              onChange={(event) => setFilters({ ...filters, tanggal_mulai: event.target.value })}
            />
          </Field>
          <Field label="Tanggal Selesai">
            <input
              className={inputClass}
              name="tanggal_selesai"
              type="date"
              value={filters.tanggal_selesai}
              onChange={(event) => setFilters({ ...filters, tanggal_selesai: event.target.value })}
            />
          </Field>
          <Field label="Per Halaman">
            <select
              className={inputClass}
              value={filters.per_page}
              onChange={(event) => setFilters({ ...filters, per_page: event.target.value })}
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
                setPage(1);
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
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Stasiun</th>
                <th className="px-4 py-3 font-medium">Curah Hujan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Sumber</th>
                <th className="px-4 py-3 font-medium">Dibuat Oleh</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-border">
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
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(row.tanggal)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.stasiun?.nama_stasiun ?? `Stasiun ${row.stasiun_id}`}</div>
                      {row.stasiun?.kode_wmo ? <div className="text-xs text-muted">WMO {row.stasiun.kode_wmo}</div> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.curah_hujan_mm == null ? "-" : `${row.curah_hujan_mm} mm`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{statusLabel(row.kode_status)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.sumber_data ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{typeof row.dibuat_oleh === "object" && row.dibuat_oleh !== null ? row.dibuat_oleh.nama_lengkap ?? "-" : "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="secondary" onClick={() => openEditForm(row)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          disabled={deletingId === row.id}
                          onClick={() => deleteRow(row)}
                        >
                          {deletingId === row.id ? "Menghapus" : "Hapus"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    Tidak ada data iklim sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">Total {meta.total} data</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Sebelumnya
            </Button>
            <span className="text-sm text-muted">Halaman {meta.current_page} / {totalPages}</span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <form onSubmit={submitImport} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Import CSV</h2>
            <p className="mt-1 text-sm text-muted">Upload file CSV atau TXT BMKG, maksimal 5MB.</p>
          </div>
          {importMessage ? (
            <Alert variant={importResult ? "success" : "error"}>{importMessage}</Alert>
          ) : null}
          {importResult ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <ImportSummary label="Sukses" value={importResult.sukses ?? 0} />
              <ImportSummary label="Dilewati" value={importResult.dilewati ?? 0} />
              <ImportSummary label="Gagal" value={importResult.gagal ?? 0} />
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto] md:items-start">
            <Field label="Stasiun" error={importErrors.stasiun_id}>
              <select
                className={inputClass}
                disabled={optionsLoading}
                value={importStationId}
                onChange={(event) => setImportStationId(event.target.value)}
              >
                <option value="">{optionsLoading ? "Memuat stasiun..." : "Pilih stasiun"}</option>
                {stasiunOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama_stasiun}{s.kode_wmo ? ` (WMO: ${s.kode_wmo})` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="File CSV" error={importErrors.file}>
              <input
                key={fileInputKey}
                accept=".csv,.txt,text/csv,text/plain"
                className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-control file:border-0 file:bg-success-subtle file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
                type="file"
                onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
              />
            </Field>
            <Button type="submit" disabled={importing} className="md:mt-6">
              {importing ? <Spinner className="mr-2 size-4" label="Mengimport" /> : null}
              Import
            </Button>
          </div>
        </form>
      </Card>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <Card className="w-full max-w-xl" role="dialog" aria-modal="true">
            <form onSubmit={submitClimate} className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{editing ? "Edit Data Iklim" : "Input Data Manual"}</h2>
                  <p className="mt-1 text-sm text-muted">Stasiun ID dan tanggal wajib diisi.</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setFormOpen(false)}>
                  Tutup
                </Button>
              </div>

              {formMessage ? <Alert variant="error">{formMessage}</Alert> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Stasiun" error={formErrors.stasiun_id}>
                  <select
                    required
                    className={inputClass}
                    disabled={optionsLoading}
                    value={form.stasiun_id}
                    onChange={(event) => setForm({ ...form, stasiun_id: event.target.value })}
                  >
                    <option value="">{optionsLoading ? "Memuat stasiun..." : "Pilih stasiun"}</option>
                    {stasiunOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama_stasiun}{s.kode_wmo ? ` (WMO: ${s.kode_wmo})` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tanggal" error={formErrors.tanggal}>
                  <input
                    required
                    className={inputClass}
                    max={maxDate}
                    type="date"
                    value={form.tanggal}
                    onChange={(event) => setForm({ ...form, tanggal: event.target.value })}
                  />
                </Field>
                <Field label="Curah Hujan (mm)" error={formErrors.curah_hujan_mm}>
                  <input
                    className={inputClass}
                    min="0"
                    step="0.1"
                    type="number"
                    value={form.curah_hujan_mm}
                    onChange={(event) => setForm({ ...form, curah_hujan_mm: event.target.value })}
                  />
                </Field>
                <Field label="Kode Status" error={formErrors.kode_status}>
                  <select
                    className={inputClass}
                    value={form.kode_status}
                    onChange={(event) => setForm({ ...form, kode_status: event.target.value })}
                  >
                    <option value="normal">Normal</option>
                    <option value="tidak_terukur">Tidak terukur</option>
                    <option value="tidak_ada_data">Tidak ada data</option>
                  </select>
                </Field>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Spinner className="mr-2 size-4" label="Menyimpan" /> : null}
                  Simpan
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
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

function ImportSummary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-control border border-border bg-background px-4 py-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}


