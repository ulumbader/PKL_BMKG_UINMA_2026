"use client";

import { type FormEvent, useState } from "react";

import { Alert, Button, Card, Spinner } from "@/components/ui";
import { ApiError, apiPost } from "@/lib/apiClient";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

type FetchResult = {
  sukses: number;
  gagal: number;
  nama_wilayah: string | null;
  kode_adm4: string;
  error?: string;
};

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function errorMessage(caught: unknown, fallback: string) {
  if (!(caught instanceof ApiError)) return fallback;
  return caught.message;
}

/* ────────────────────────────────────────────
   Main Page
   ──────────────────────────────────────────── */

export default function Page() {
  const [fetching, setFetching] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<FetchResult | null>(null);

  async function submitFetch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    setResult(null);
    setFetching(true);

    try {
      const response = await apiPost<FetchResult>("/admin/prakiraan-cuaca/fetch");
      setNotice(response.message);
      setResult(response.data);
    } catch (caught) {
      if (caught instanceof ApiError) {
        // Handle specific status codes with clear messages
        if (caught.statusCode === 502) {
          setError(caught.message || "API BMKG tidak dapat dihubungi. Server BMKG mungkin sedang down atau timeout. Coba lagi nanti.");
        } else if (caught.statusCode === 422) {
          setError(caught.message || "Kode ADM4 belum dikonfigurasi di backend. Hubungi administrator untuk mengatur BMKG_KODE_ADM4.");
        } else {
          setError(caught.message);
        }
      } else {
        setError(errorMessage(caught, "Gagal mengambil data prakiraan cuaca."));
      }
    } finally {
      setFetching(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Prakiraan Cuaca</h1>
        <p className="mt-1 text-sm text-muted">
          Ambil data prakiraan cuaca terbaru dari API BMKG untuk wilayah yang sudah dikonfigurasi.
        </p>
      </div>

      {/* Alerts */}
      {notice ? <Alert variant="success">{notice}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      {/* ──────── Fetch Form ──────── */}
      <Card>
        <form onSubmit={submitFetch} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Fetch Data Prakiraan Cuaca</h2>
            <p className="mt-1 text-sm text-muted">
              Klik tombol di bawah untuk mengambil data prakiraan cuaca terbaru dari API BMKG.
              Kode wilayah (ADM4) diambil dari konfigurasi backend.
            </p>
          </div>

          <Button type="submit" disabled={fetching}>
            {fetching ? <Spinner className="mr-2 size-4" label="Mengambil data" /> : (
              <svg className="mr-2 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Fetch Data Terbaru dari BMKG
          </Button>
        </form>
      </Card>

      {/* ──────── Result Card ──────── */}
      {result ? (
        <Card>
          <h2 className="text-lg font-semibold">Hasil Fetch</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ResultItem label="Wilayah" value={result.nama_wilayah || "-"} />
            <ResultItem label="Kode ADM4" value={result.kode_adm4 || "-"} />
            <ResultItem
              label="Prakiraan Disimpan"
              value={String(result.sukses)}
              highlight={result.sukses > 0 ? "success" : undefined}
            />
            <ResultItem
              label="Gagal"
              value={String(result.gagal)}
              highlight={result.gagal > 0 ? "danger" : undefined}
            />
          </div>
        </Card>
      ) : null}

      {/* ──────── Info Card ──────── */}
      <Card>
        <h2 className="text-lg font-semibold">Informasi</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">•</span>
            <span>
              Data prakiraan cuaca diambil dari API publik BMKG dan <strong>terpisah</strong> dari data iklim harian.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">•</span>
            <span>
              Data ini <strong>tidak digunakan</strong> sebagai input rule engine rekomendasi tanam.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">•</span>
            <span>
              Kode wilayah (ADM4) dikonfigurasi di backend melalui <code className="rounded bg-background px-1.5 py-0.5 text-xs">BMKG_KODE_ADM4</code> pada file <code className="rounded bg-background px-1.5 py-0.5 text-xs">.env</code>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-wait">•</span>
            <span>
              Jika API BMKG sedang down (error 502), coba lagi beberapa saat kemudian.
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function ResultItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "success" | "danger";
}) {
  const highlightClass =
    highlight === "success"
      ? "text-primary"
      : highlight === "danger"
        ? "text-danger"
        : "text-foreground";

  return (
    <div className="rounded-control border border-border bg-background px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={["mt-1 text-lg font-semibold", highlightClass].join(" ")}>{value}</p>
    </div>
  );
}
