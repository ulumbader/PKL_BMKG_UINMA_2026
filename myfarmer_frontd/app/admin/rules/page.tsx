"use client";

import { type FormEvent, useEffect, useState } from "react";

import { ConfirmDialog, EmptyState, Field, FilterPanel, Modal, PageHeader, StatusBadge, ToastNotice, controlClass } from "@/components/admin/AdminUI";
import { Alert, Button, Card, Skeleton, Spinner } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { ApiError, apiDelete, apiGet, apiPost, apiPut } from "@/lib/apiClient";

type Rule = {
  id: number;
  nama_rule: string;
  deskripsi?: string;
  parameter: Partial<RuleParameter>;
  is_active: boolean;
  updated_at?: string;
};

type FieldErrors = Record<string, string>;

type RuleForm = {
  nama_rule: string;
  deskripsi: string;
  parameter: RuleParameterForm;
  is_active: boolean;
};

type RuleParameter = {
  min_curah_hujan_dasarian: number;
  min_dasarian_berturut: number;
  total_alternatif_mm: number;
  pakai_kriteria_hari_hujan: boolean;
  min_hari_hujan_dasarian: number;
};

type RuleParameterForm = {
  min_curah_hujan_dasarian: string;
  min_dasarian_berturut: string;
  total_alternatif_mm: string;
  pakai_kriteria_hari_hujan: boolean;
  min_hari_hujan_dasarian: string;
};

const defaultParameter: RuleParameterForm = {
  min_curah_hujan_dasarian: "50",
  min_dasarian_berturut: "3",
  total_alternatif_mm: "150",
  pakai_kriteria_hari_hujan: true,
  min_hari_hujan_dasarian: "3",
};

const emptyForm: RuleForm = {
  nama_rule: "",
  deskripsi: "",
  parameter: defaultParameter,
  is_active: true,
};

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
  if (caught.statusCode === 403) return "Aksi ini hanya boleh dilakukan super admin.";
  if (caught.statusCode === 409) return caught.message || "Rule sudah dipakai. Nonaktifkan rule jika tidak bisa dihapus.";
  return caught.message;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("id-ID");
}

function makeRuleForm(rule: Rule): RuleForm {
  const parameter = rule.parameter ?? {};

  return {
    nama_rule: rule.nama_rule,
    deskripsi: rule.deskripsi ?? "",
    parameter: {
      min_curah_hujan_dasarian: String(
        parameter.min_curah_hujan_dasarian ?? defaultParameter.min_curah_hujan_dasarian,
      ),
      min_dasarian_berturut: String(
        parameter.min_dasarian_berturut ?? defaultParameter.min_dasarian_berturut,
      ),
      total_alternatif_mm: String(
        parameter.total_alternatif_mm ?? defaultParameter.total_alternatif_mm,
      ),
      pakai_kriteria_hari_hujan:
        parameter.pakai_kriteria_hari_hujan ?? defaultParameter.pakai_kriteria_hari_hujan,
      min_hari_hujan_dasarian: String(
        parameter.min_hari_hujan_dasarian ?? defaultParameter.min_hari_hujan_dasarian,
      ),
    },
    is_active: Boolean(rule.is_active),
  };
}

function makePayload(form: RuleForm, isSuperAdmin: boolean) {
  const parameter: RuleParameter = {
    min_curah_hujan_dasarian: Number(form.parameter.min_curah_hujan_dasarian),
    min_dasarian_berturut: Number(form.parameter.min_dasarian_berturut),
    total_alternatif_mm: Number(form.parameter.total_alternatif_mm),
    pakai_kriteria_hari_hujan: form.parameter.pakai_kriteria_hari_hujan,
    min_hari_hujan_dasarian: Number(form.parameter.min_hari_hujan_dasarian),
  };
  const payload: Record<string, unknown> = { parameter, is_active: form.is_active };

  if (isSuperAdmin) {
    payload.nama_rule = form.nama_rule;
    payload.deskripsi = form.deskripsi;
  }

  return payload;
}

const parameterDisplay: Array<{
  key: keyof RuleParameter;
  label: string;
  unit?: string;
}> = [
  { key: "min_curah_hujan_dasarian", label: "CH minimum", unit: "mm/dasarian" },
  { key: "min_dasarian_berturut", label: "Jendela evaluasi", unit: "dasarian" },
  { key: "total_alternatif_mm", label: "Total CH alternatif", unit: "mm" },
  { key: "pakai_kriteria_hari_hujan", label: "Kriteria hari hujan" },
  { key: "min_hari_hujan_dasarian", label: "HH minimum", unit: "hari/dasarian" },
];

function formatParameterValue(key: keyof RuleParameter, value: RuleParameter[keyof RuleParameter] | undefined, unit?: string) {
  if (value == null) return "-";
  if (key === "pakai_kriteria_hari_hujan") return value ? "Aktif" : "Nonaktif";
  return unit ? `${value} ${unit}` : String(value);
}

export default function Page() {
  const { nama_role } = useAuth();
  const isSuperAdmin = nama_role === "super_admin";

  const [activeFilter, setActiveFilter] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [form, setForm] = useState<RuleForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Rule | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRules() {
      setLoading(true);
      setError("");

      try {
        const query = appliedFilter ? `?is_active=${appliedFilter}` : "";
        const response = await apiGet<Rule[]>(`/admin/rules${query}`);
        if (!active) return;
        setRules(response.data);
      } catch (caught) {
        if (!active) return;
        setRules([]);
        setError(errorMessage(caught, "Daftar rule gagal dimuat."));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRules();

    return () => {
      active = false;
    };
  }, [appliedFilter, reloadKey]);

  function openCreateForm() {
    setEditing(null);
    setForm({ ...emptyForm, parameter: { ...defaultParameter } });
    setFormErrors({});
    setFormMessage("");
    setFormOpen(true);
  }

  function openEditForm(rule: Rule) {
    setEditing(rule);
    setForm(makeRuleForm(rule));
    setFormErrors({});
    setFormMessage("");
    setFormOpen(true);
  }

  function openComparisonForm(rule: Rule) {
    const source = makeRuleForm(rule);
    const pakaiHariHujan = !source.parameter.pakai_kriteria_hari_hujan;

    setEditing(null);
    setForm({
      ...source,
      nama_rule: `${rule.nama_rule} (${pakaiHariHujan ? "Dengan HH" : "Tanpa HH"})`,
      deskripsi: `${source.deskripsi || rule.nama_rule} Salinan untuk perbandingan metodologi ${
        pakaiHariHujan ? "dengan" : "tanpa"
      } kriteria hari hujan.`,
      parameter: {
        ...source.parameter,
        pakai_kriteria_hari_hujan: pakaiHariHujan,
      },
      is_active: true,
    });
    setFormErrors({});
    setFormMessage("");
    setFormOpen(true);
  }

  async function submitFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setAppliedFilter(activeFilter);
  }

  async function submitRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setFormMessage("");
    setFormErrors({});

    try {
      const response = editing
        ? await apiPut<Rule>(`/admin/rules/${editing.id}`, makePayload(form, isSuperAdmin))
        : await apiPost<Rule>("/admin/rules", makePayload(form, true));

      setNotice(response.message);
      setFormOpen(false);
      setReloadKey((value) => value + 1);
    } catch (caught) {
      setFormErrors(caught instanceof ApiError ? fieldErrors(caught.errors) : {});
      setFormMessage(errorMessage(caught, "Rule gagal disimpan."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteRule(rule: Rule) {
    setDeletingId(rule.id);
    setNotice("");
    setError("");

    try {
      const response = await apiDelete<null>(`/admin/rules/${rule.id}`);
      setNotice(response.message);
      setPendingDelete(null);
      setReloadKey((value) => value + 1);
    } catch (caught) {
      setError(errorMessage(caught, "Rule gagal dihapus."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Rule Rekomendasi" description="Kelola parameter metodologi evaluasi rekomendasi tanam." action={isSuperAdmin ? <Button type="button" onClick={openCreateForm}>Buat Rule Baru</Button> : undefined} />

      <ToastNotice message={notice} onDismiss={() => setNotice("")} />
      {error ? <Alert variant="error">{error}</Alert> : null}

      <FilterPanel activeCount={appliedFilter ? 1 : 0}>
        <form onSubmit={submitFilter} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Status Aktif">
            <select
              className={controlClass}
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value)}
            >
              <option value="">Semua</option>
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
          </Field>
          <Button type="submit">Filter</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setActiveFilter("");
              setAppliedFilter("");
            }}
          >
            Reset
          </Button>
        </form>
      </FilterPanel>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-background text-left text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Rule</th>
                <th scope="col" className="px-4 py-3 font-medium">Parameter</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Update</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-border">
                    {Array.from({ length: 5 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : rules.length ? (
                rules.map((rule) => (
                  <tr key={rule.id} className="border-b border-border transition-colors hover:bg-background/70 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{rule.nama_rule}</div>
                      <div className="mt-1 max-w-md text-xs text-muted">{rule.deskripsi || "-"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {parameterDisplay.map(({ key, label, unit }) => (
                          <div key={key} className="flex items-center justify-between gap-4 text-xs">
                            <span className="text-muted">{label}</span>
                            <span className="text-right font-medium">
                              {formatParameterValue(key, rule.parameter?.[key], unit)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3"><RuleStatus active={rule.is_active} /></td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDateTime(rule.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {isSuperAdmin ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => openComparisonForm(rule)}
                          >
                            Bandingkan HH
                          </Button>
                        ) : null}
                        <Button type="button" size="sm" variant="secondary" onClick={() => openEditForm(rule)}>
                          Edit
                        </Button>
                        {isSuperAdmin ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            disabled={deletingId === rule.id}
                            onClick={() => setPendingDelete(rule)}
                          >
                            {deletingId === rule.id ? "Menghapus" : "Hapus"}
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}><EmptyState title="Rule tidak ditemukan" description="Ubah filter atau buat rule rekomendasi baru." /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Rule" : "Buat Rule Baru"} description="Parameter ditata per field agar aman ditinjau sebelum disimpan." size="lg">
            <form onSubmit={submitRule} className="space-y-4">
              {formMessage ? <Alert variant="error">{formMessage}</Alert> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama Rule" error={formErrors.nama_rule}>
                  <input
                    required
                    className={controlClass}
                    disabled={!isSuperAdmin}
                    value={form.nama_rule}
                    onChange={(event) => setForm({ ...form, nama_rule: event.target.value })}
                  />
                </Field>
                <label className="flex items-center gap-2 self-end text-sm font-medium">
                  <input
                    className="size-4 accent-primary"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                  />
                  Rule aktif
                </label>
                <div className="sm:col-span-2">
                  <Field label="Deskripsi" error={formErrors.deskripsi}>
                    <textarea
                      className="min-h-24 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-background disabled:text-muted"
                      disabled={!isSuperAdmin}
                      value={form.deskripsi}
                      onChange={(event) => setForm({ ...form, deskripsi: event.target.value })}
                    />
                  </Field>
                </div>
              </div>

              <div className="space-y-4 rounded-card border border-border bg-background p-4">
                <div>
                  <h3 className="text-sm font-semibold">Parameter Metodologi AMH</h3>
                  <p className="mt-1 text-xs text-muted">
                    Kriteria utama dan alternatif memakai curah hujan. Kriteria hari hujan dapat diaktifkan
                    untuk penguatan metodologi Jawa Timur.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Curah Hujan Minimum"
                    hint="Batas CH setiap dasarian pada kriteria utama."
                    error={formErrors["parameter.min_curah_hujan_dasarian"]}
                  >
                    <div className="relative">
                      <input
                        required
                        className={`${controlClass} pr-28`}
                        min="0"
                        step="0.1"
                        type="number"
                        value={form.parameter.min_curah_hujan_dasarian}
                        onChange={(event) => setForm({
                          ...form,
                          parameter: {
                            ...form.parameter,
                            min_curah_hujan_dasarian: event.target.value,
                          },
                        })}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">
                        mm/dasarian
                      </span>
                    </div>
                  </Field>

                  <Field
                    label="Jendela Evaluasi"
                    hint="Jumlah dasarian berturut-turut yang diperiksa."
                    error={formErrors["parameter.min_dasarian_berturut"]}
                  >
                    <div className="relative">
                      <input
                        required
                        className={`${controlClass} pr-24`}
                        min="1"
                        max="36"
                        step="1"
                        type="number"
                        value={form.parameter.min_dasarian_berturut}
                        onChange={(event) => setForm({
                          ...form,
                          parameter: {
                            ...form.parameter,
                            min_dasarian_berturut: event.target.value,
                          },
                        })}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">
                        dasarian
                      </span>
                    </div>
                  </Field>

                  <Field
                    label="Total Curah Hujan Alternatif"
                    hint="Minimum total CH agar jalur alternatif dapat dinyatakan terpenuhi."
                    error={formErrors["parameter.total_alternatif_mm"]}
                  >
                    <div className="relative">
                      <input
                        required
                        className={`${controlClass} pr-12`}
                        min="0"
                        step="0.1"
                        type="number"
                        value={form.parameter.total_alternatif_mm}
                        onChange={(event) => setForm({
                          ...form,
                          parameter: {
                            ...form.parameter,
                            total_alternatif_mm: event.target.value,
                          },
                        })}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">
                        mm
                      </span>
                    </div>
                  </Field>

                  <Field
                    label="Hari Hujan Minimum"
                    hint="Tetap disimpan, tetapi hanya dipakai ketika toggle HH aktif."
                    error={formErrors["parameter.min_hari_hujan_dasarian"]}
                  >
                    <div className="relative">
                      <input
                        required
                        className={`${controlClass} pr-28`}
                        disabled={!form.parameter.pakai_kriteria_hari_hujan}
                        min="1"
                        max="11"
                        step="1"
                        type="number"
                        value={form.parameter.min_hari_hujan_dasarian}
                        onChange={(event) => setForm({
                          ...form,
                          parameter: {
                            ...form.parameter,
                            min_hari_hujan_dasarian: event.target.value,
                          },
                        })}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">
                        hari/dasarian
                      </span>
                    </div>
                  </Field>

                  <div className="rounded-control border border-border bg-surface p-3 sm:col-span-2">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">Gunakan Kriteria Hari Hujan</p>
                        <p className="mt-1 text-xs text-muted">
                          Aktifkan untuk mewajibkan jumlah hari hujan minimum pada setiap dasarian.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={form.parameter.pakai_kriteria_hari_hujan}
                        className={[
                          "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
                          form.parameter.pakai_kriteria_hari_hujan
                            ? "border-primary bg-primary"
                            : "border-border bg-background",
                        ].join(" ")}
                        onClick={() => setForm({
                          ...form,
                          parameter: {
                            ...form.parameter,
                            pakai_kriteria_hari_hujan: !form.parameter.pakai_kriteria_hari_hujan,
                          },
                        })}
                      >
                        <span
                          className={[
                            "absolute left-0.5 top-0.5 size-4 rounded-full bg-white transition-transform",
                            form.parameter.pakai_kriteria_hari_hujan ? "translate-x-5" : "translate-x-0",
                          ].join(" ")}
                        />
                        <span className="sr-only">
                          {form.parameter.pakai_kriteria_hari_hujan ? "Kriteria HH aktif" : "Kriteria HH nonaktif"}
                        </span>
                      </button>
                    </div>
                    {formErrors["parameter.pakai_kriteria_hari_hujan"] ? (
                      <p className="mt-2 text-xs text-danger">
                        {formErrors["parameter.pakai_kriteria_hari_hujan"]}
                      </p>
                    ) : null}
                  </div>
                </div>

                {formErrors.parameter ? <p className="text-xs text-danger">{formErrors.parameter}</p> : null}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Batal</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Spinner className="mr-2 size-4" label="Menyimpan" /> : null}
                  Simpan
                </Button>
              </div>
            </form>
      </Modal>
      <ConfirmDialog open={Boolean(pendingDelete)} title="Hapus rule rekomendasi?" description={pendingDelete ? `Rule “${pendingDelete.nama_rule}” akan dihapus. Rule yang sudah digunakan mungkin ditolak oleh backend.` : ""} confirmLabel="Hapus rule" busy={deletingId !== null} onCancel={() => setPendingDelete(null)} onConfirm={() => pendingDelete ? deleteRule(pendingDelete) : undefined} />
    </div>
  );
}

function RuleStatus({ active }: { active: boolean }) {
  return <StatusBadge tone={active ? "success" : "neutral"}>{active ? "Aktif" : "Nonaktif"}</StatusBadge>;
}
