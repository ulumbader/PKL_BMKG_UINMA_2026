"use client";

import { type FormEvent, useEffect, useState } from "react";

import { ConfirmDialog, EmptyState, Field, FilterPanel, Modal, PageHeader, Pagination, StatusBadge, ToastNotice, controlClass } from "@/components/admin/AdminUI";
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
  const [pendingDelete, setPendingDelete] = useState<ClimateRow | null>(null);

  const [importOpen, setImportOpen] = useState(false);
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

  function openImportForm() {
    setImportStationId("");
    setImportFile(null);
    setImportErrors({});
    setImportMessage("");
    setImportResult(null);
    setFileInputKey((value) => value + 1);
    setImportOpen(true);
  }

  function openEditForm(row: ClimateRow) {
    setEditing(row);
    setForm({
      stasiun_id: String(row.stasiun_id),
      tanggal: row.tanggal.slice(0, 10),
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
    setDeletingId(row.id);
    setNotice("");

    try {
      const response = await apiDelete<null>(`/admin/data-iklim/${row.id}`);
      setNotice(response.message);
      setPendingDelete(null);
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
      const response = await apiPost<ImportResult>("/admin/data-iklim/import", body, {
        signal: AbortSignal.timeout(180_000),
      });
      setImportMessage(response.message);
      setImportResult(response.data.ringkasan ?? null);
      setNotice(response.message);
      setImportOpen(false);
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
      <PageHeader
        title="Data Iklim Harian"
        description="Kelola observasi curah hujan harian dan import data CSV BMKG."
        action={(
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={openImportForm}>Import CSV</Button>
            <Button type="button" onClick={openCreateForm}>Input Data Manual</Button>
          </div>
        )}
      />

      <ToastNotice message={notice} onDismiss={() => setNotice("")} />
      {tableError ? <Alert variant="error">{tableError}</Alert> : null}

      <FilterPanel activeCount={Object.values(appliedFilters).filter(Boolean).length - 1}>
        <form onSubmit={submitFilter} className="grid gap-3 md:grid-cols-6">
          <Field label="Stasiun">
            <select
              className={controlClass}
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
              className={controlClass}
              name="tanggal"
              type="date"
              value={filters.tanggal}
              onChange={(event) => setFilters({ ...filters, tanggal: event.target.value })}
            />
          </Field>
          <Field label="Tanggal Mulai">
            <input
              className={controlClass}
              name="tanggal_mulai"
              type="date"
              value={filters.tanggal_mulai}
              onChange={(event) => setFilters({ ...filters, tanggal_mulai: event.target.value })}
            />
          </Field>
          <Field label="Tanggal Selesai">
            <input
              className={controlClass}
              name="tanggal_selesai"
              type="date"
              value={filters.tanggal_selesai}
              onChange={(event) => setFilters({ ...filters, tanggal_selesai: event.target.value })}
            />
          </Field>
          <Field label="Per Halaman">
            <select
              className={controlClass}
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
      </FilterPanel>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-background text-left text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Tanggal</th>
                <th scope="col" className="px-4 py-3 font-medium">Stasiun</th>
                <th scope="col" className="px-4 py-3 font-medium">Curah Hujan</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Sumber</th>
                <th scope="col" className="px-4 py-3 font-medium">Dibuat Oleh</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Aksi</th>
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
                  <tr key={row.id} className="border-b border-border transition-colors hover:bg-background/70 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(row.tanggal)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.stasiun?.nama_stasiun ?? `Stasiun ${row.stasiun_id}`}</div>
                      {row.stasiun?.kode_wmo ? <div className="text-xs text-muted">WMO {row.stasiun.kode_wmo}</div> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.curah_hujan_mm == null ? "-" : `${row.curah_hujan_mm} mm`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3"><StatusBadge tone={row.kode_status === "normal" ? "success" : "warning"}>{statusLabel(row.kode_status)}</StatusBadge></td>
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
                          onClick={() => setPendingDelete(row)}
                        >
                          {deletingId === row.id ? "Menghapus" : "Hapus"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}><EmptyState title="Data iklim tidak ditemukan" description="Ubah filter atau tambahkan data iklim harian baru." /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={meta.current_page} totalPages={totalPages} total={meta.total} loading={loading} onPageChange={setPage} />
      </Card>

      <Modal
        open={importOpen}
        onClose={importing ? () => undefined : () => setImportOpen(false)}
        title="Import CSV"
        description="Upload file CSV curah hujan, maksimal 5MB."
        size="lg"
      >
        <form onSubmit={submitImport} className="space-y-4">
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Stasiun" error={importErrors.stasiun_id} required>
              <select
                className={controlClass}
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
            <Field label="File CSV" error={importErrors.file} required>
              <input
                key={fileInputKey}
                accept=".csv,.txt,text/csv,text/plain"
                className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-control file:border-0 file:bg-success-subtle file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
                type="file"
                onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" disabled={importing} onClick={() => setImportOpen(false)}>
              {importResult ? "Tutup" : "Batal"}
            </Button>
            <Button type="submit" disabled={importing}>
              {importing ? <Spinner className="mr-2 size-4" label="Mengimport" /> : null}
              Import CSV
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Data Iklim" : "Input Data Manual"} description="Lengkapi stasiun, tanggal, curah hujan, dan status observasi.">
            <form onSubmit={submitClimate} className="space-y-4">
              {formMessage ? <Alert variant="error">{formMessage}</Alert> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Stasiun" error={formErrors.stasiun_id}>
                  <select
                    required
                    className={controlClass}
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
                    className={controlClass}
                    max={maxDate}
                    type="date"
                    value={form.tanggal}
                    onChange={(event) => setForm({ ...form, tanggal: event.target.value })}
                  />
                </Field>
                <Field label="Curah Hujan (mm)" error={formErrors.curah_hujan_mm}>
                  <input
                    className={controlClass}
                    min="0"
                    step="0.1"
                    type="number"
                    value={form.curah_hujan_mm}
                    onChange={(event) => setForm({ ...form, curah_hujan_mm: event.target.value })}
                  />
                </Field>
                <Field label="Kode Status" error={formErrors.kode_status}>
                  <select
                    className={controlClass}
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
      </Modal>
      <ConfirmDialog open={Boolean(pendingDelete)} title="Hapus data iklim?" description={pendingDelete ? `Data tanggal ${formatDate(pendingDelete.tanggal)} akan dihapus permanen.` : ""} confirmLabel="Hapus data" busy={deletingId !== null} onCancel={() => setPendingDelete(null)} onConfirm={() => pendingDelete ? deleteRow(pendingDelete) : undefined} />
    </div>
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
