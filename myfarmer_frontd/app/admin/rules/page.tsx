"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";

import { Alert, Button, Card, Skeleton, Spinner } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { ApiError, apiDelete, apiGet, apiPost, apiPut } from "@/lib/apiClient";

type Rule = {
  id: number;
  nama_rule: string;
  deskripsi?: string;
  parameter: Record<string, number | string | null>;
  is_active: boolean;
  updated_at?: string;
};

type FieldErrors = Record<string, string>;

type RuleForm = {
  nama_rule: string;
  deskripsi: string;
  parameter: Record<string, string>;
  is_active: boolean;
};

const defaultParameter = {
  min_curah_hujan_dasarian: "",
  min_dasarian_berturut: "",
};

const emptyForm: RuleForm = {
  nama_rule: "",
  deskripsi: "",
  parameter: defaultParameter,
  is_active: true,
};

const inputClass =
  "h-10 w-full rounded-control border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-background disabled:text-muted";

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
  return {
    nama_rule: rule.nama_rule,
    deskripsi: rule.deskripsi ?? "",
    parameter: Object.fromEntries(
      Object.entries(rule.parameter ?? defaultParameter).map(([key, value]) => [key, value == null ? "" : String(value)]),
    ),
    is_active: Boolean(rule.is_active),
  };
}

function makePayload(form: RuleForm, isSuperAdmin: boolean) {
  const parameter = Object.fromEntries(
    Object.entries(form.parameter).map(([key, value]) => [key, Number(value)]),
  );
  const payload: Record<string, unknown> = { parameter, is_active: form.is_active };

  if (isSuperAdmin) {
    payload.nama_rule = form.nama_rule;
    payload.deskripsi = form.deskripsi;
  }

  return payload;
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
    setForm(emptyForm);
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
    if (!window.confirm(`Hapus rule ${rule.nama_rule}?`)) return;

    setDeletingId(rule.id);
    setNotice("");
    setError("");

    try {
      const response = await apiDelete<null>(`/admin/rules/${rule.id}`);
      setNotice(response.message);
      setReloadKey((value) => value + 1);
    } catch (caught) {
      setError(errorMessage(caught, "Rule gagal dihapus."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rule Rekomendasi</h1>
          <p className="mt-1 text-sm text-muted">Kelola parameter rule evaluasi rekomendasi tanam.</p>
        </div>
        {isSuperAdmin ? <Button type="button" onClick={openCreateForm}>Buat Rule Baru</Button> : null}
      </div>

      {notice ? <Alert variant="success">{notice}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <Card>
        <form onSubmit={submitFilter} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Status Aktif">
            <select
              className={inputClass}
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
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="border-b border-border bg-background text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Rule</th>
                <th className="px-4 py-3 font-medium">Parameter</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Update</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
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
                  <tr key={rule.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{rule.nama_rule}</div>
                      <div className="mt-1 max-w-md text-xs text-muted">{rule.deskripsi || "-"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {Object.entries(rule.parameter ?? {}).map(([key, value]) => (
                          <div key={key} className="flex gap-2 text-xs">
                            <span className="text-muted">{key}</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3"><RuleStatus active={rule.is_active} /></td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDateTime(rule.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="secondary" onClick={() => openEditForm(rule)}>
                          Edit
                        </Button>
                        {isSuperAdmin ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            disabled={deletingId === rule.id}
                            onClick={() => deleteRule(rule)}
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
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">Belum ada rule sesuai filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <Card className="w-full max-w-2xl" role="dialog" aria-modal="true">
            <form onSubmit={submitRule} className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{editing ? "Edit Rule" : "Buat Rule Baru"}</h2>
                  <p className="mt-1 text-sm text-muted">Parameter diedit lewat field terpisah, bukan JSON mentah.</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setFormOpen(false)}>Tutup</Button>
              </div>

              {formMessage ? <Alert variant="error">{formMessage}</Alert> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama Rule" error={formErrors.nama_rule}>
                  <input
                    required
                    className={inputClass}
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
                <Field label="Deskripsi" error={formErrors.deskripsi}>
                  <textarea
                    className="min-h-24 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-background disabled:text-muted"
                    disabled={!isSuperAdmin}
                    value={form.deskripsi}
                    onChange={(event) => setForm({ ...form, deskripsi: event.target.value })}
                  />
                </Field>
                <div className="space-y-3">
                  {Object.keys(form.parameter).map((key) => (
                    <Field key={key} label={key} error={formErrors[`parameter.${key}`]}>
                      <input
                        required
                        className={inputClass}
                        step="any"
                        type="number"
                        value={form.parameter[key]}
                        onChange={(event) => setForm({
                          ...form,
                          parameter: { ...form.parameter, [key]: event.target.value },
                        })}
                      />
                    </Field>
                  ))}
                  {formErrors.parameter ? <p className="text-xs text-danger">{formErrors.parameter}</p> : null}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Batal</Button>
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

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error ? <span className="block text-xs font-normal text-danger">{error}</span> : null}
    </label>
  );
}

function RuleStatus({ active }: { active: boolean }) {
  return (
    <span className={[
      "inline-flex rounded-control border px-2 py-1 text-xs font-medium",
      active ? "border-primary/30 bg-success-subtle text-primary" : "border-border bg-background text-muted",
    ].join(" ")}
    >
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}
