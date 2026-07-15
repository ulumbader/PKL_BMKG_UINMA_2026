"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Card, Skeleton } from "@/components/ui";
import { ApiError, apiGet } from "@/lib/apiClient";
import { fetchBmkgWeather, type BmkgWeatherData } from "@/lib/bmkgClient";

type Resource<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  message: string;
};

/* WeatherSlot & BmkgWeatherData sekarang diimpor dari @/lib/bmkgClient */

/** Kode wilayah ADM4 — sesuai konfigurasi backend (config/myfarmer.php) */
const BMKG_KODE_ADM4 = process.env.NEXT_PUBLIC_BMKG_KODE_ADM4 || "35.07.20.2001";

/** Auto-refresh interval: 15 menit (dalam ms) */
const WEATHER_REFRESH_MS = 15 * 60 * 1000;

type RecommendationData = {
  status_rekomendasi: string;
  label_rekomendasi: string;
  tanggal_evaluasi: string;
  rule?: { nama?: string };
};

type SummaryData = {
  ringkasan?: string;
  ringkasan_text?: string;
  published_at: string;
};

type RainData = {
  periode: {
    tahun: number;
    bulan: number;
    dasarian_ke: number;
  };
  curah_hujan: {
    total_mm: string;
    jumlah_hari_hujan: number;
  };
  status_musim: string;
  stasiun: {
    nama: string;
    kode_wmo: string;
  };
};

type ContentItem = {
  judul: string;
  isi: string;
  tipe: "pengumuman" | "tips" | string;
};

function usePublicData<T>(path: string): Resource<T> {
  const [resource, setResource] = useState<Resource<T>>({
    data: null,
    error: null,
    loading: true,
    message: "",
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await apiGet<T | null>(path);
        if (active) {
          setResource({
            data: response.data,
            error: null,
            loading: false,
            message: response.message,
          });
        }
      } catch (error) {
        if (active) {
          setResource({
            data: null,
            error: error instanceof ApiError ? error.message : "Data belum bisa dimuat.",
            loading: false,
            message: "",
          });
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [path]);

  return resource;
}

function formatDateTime(value: string) {
  const date = new Date(value.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function weatherIcon(condition: string) {
  const normalized = condition.toLowerCase();

  if (normalized.includes("petir") || normalized.includes("badai")) return "⚡";
  if (normalized.includes("hujan")) return "☔";
  if (normalized.includes("cerah") && normalized.includes("berawan")) return "⛅";
  if (normalized.includes("berawan") || normalized.includes("mendung")) return "☁";
  if (normalized.includes("cerah")) return "☀";
  return "○";
}

function statusClass(status: string) {
  if (status === "optimal_tanam") return "border-primary/30 bg-success-subtle text-primary";
  if (status === "tunggu") return "border-wait/30 bg-warning-subtle text-wait";
  if (status === "tidak_disarankan") return "border-danger/30 bg-danger-subtle text-danger";
  return "border-border bg-surface text-muted";
}

function Section({
  children,
  subtitle,
  title,
}: {
  children: React.ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-normal text-foreground sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-6 text-muted sm:text-base">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function SectionError({ message }: { message: string }) {
  return <Alert variant="error">{message}</Alert>;
}

function EmptyCard({ message }: { message: string }) {
  return (
    <Card>
      <p className="text-sm leading-6 text-muted">{message}</p>
    </Card>
  );
}

function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className={index === 0 ? "h-5 w-2/3" : "h-4 w-full"} />
      ))}
    </Card>
  );
}

function WeatherSection() {
  const [data, setData] = useState<BmkgWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadWeather = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchBmkgWeather(BMKG_KODE_ADM4);
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data cuaca.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(loadWeather, 0);
    const interval = setInterval(loadWeather, WEATHER_REFRESH_MS);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [loadWeather]);

  return (
    <Section
      title="Cuaca Real-Time"
      subtitle="Prakiraan cuaca langsung dari BMKG untuk wilayah pantauan."
    >
      {loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error && !data ? (
        <SectionError message={error} />
      ) : !data || data.prakiraan.length === 0 ? (
        <EmptyCard message="Belum ada data prakiraan cuaca dari BMKG." />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span>Wilayah: {data.wilayah}</span>
            <span>Provinsi: {data.provinsi}</span>
            {lastUpdated ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                Live · diperbarui {formatTime(lastUpdated)}
              </span>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {data.prakiraan.slice(0, 9).map((slot) => (
              <Card key={`${slot.waktu_prakiraan}-${slot.kondisi_cuaca}`} className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{formatDateTime(slot.waktu_prakiraan)}</p>
                    <p className="mt-1 text-sm text-muted">{slot.kondisi_cuaca}</p>
                  </div>
                  {slot.ikon_url ? (
                    <img
                      src={slot.ikon_url}
                      alt={slot.kondisi_cuaca}
                      className="size-10 object-contain"
                    />
                  ) : (
                    <span className="text-2xl" aria-hidden="true">
                      {weatherIcon(slot.kondisi_cuaca)}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Metric label="Suhu" value={`${slot.suhu_celsius}°C`} />
                  <Metric label="Hujan" value={`${slot.curah_hujan_mm} mm`} />
                  <Metric label="Lembap" value={`${slot.kelembapan_persen}%`} />
                  <Metric label="Angin" value={`${slot.kecepatan_angin_kmjam} km/j · ${slot.arah_angin}`} />
                  <Metric label="Pandang" value={slot.jarak_pandang} />
                </div>
              </Card>
            ))}
          </div>
          {error ? (
            <Alert variant="error">Gagal memperbarui: {error}. Menampilkan data terakhir.</Alert>
          ) : null}
        </div>
      )}
    </Section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeStyle: "short",
  }).format(date);
}

function RecommendationSection() {
  const recommendation = usePublicData<RecommendationData>("/publik/rekomendasi-terkini");

  return (
    <Section title="Rekomendasi Tanam" subtitle="Label rekomendasi mengikuti data dari backend.">
      {recommendation.loading ? (
        <CardSkeleton rows={4} />
      ) : recommendation.error ? (
        <SectionError message={recommendation.error} />
      ) : !recommendation.data ? (
        <EmptyCard message={recommendation.message} />
      ) : (
        <Card className="space-y-4">
          <span
            className={`inline-flex rounded-control border px-3 py-1 text-sm font-semibold ${statusClass(
              recommendation.data.status_rekomendasi,
            )}`}
          >
            {recommendation.data.label_rekomendasi}
          </span>
          <div>
            <p className="text-sm text-muted">Status</p>
            <p className="text-lg font-semibold">{recommendation.data.status_rekomendasi}</p>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <Metric label="Tanggal Evaluasi" value={formatDateTime(recommendation.data.tanggal_evaluasi)} />
            <Metric label="Rule" value={recommendation.data.rule?.nama ?? "-"} />
          </div>
        </Card>
      )}
    </Section>
  );
}

function SummarySection() {
  const summary = usePublicData<SummaryData>("/publik/ringkasan-terkini");

  return (
    <Section
      title="Ringkasan Kondisi Iklim"
      subtitle="Ringkasan AI dari backend Groq yang sudah dipublikasikan admin."
    >
      {summary.loading ? (
        <CardSkeleton rows={5} />
      ) : summary.error ? (
        <SectionError message={summary.error} />
      ) : !summary.data ? (
        <EmptyCard message={summary.message} />
      ) : (
        <Card className="border-primary/30 bg-success-subtle">
          <p className="text-lg leading-8 text-foreground">
            {summary.data.ringkasan ?? summary.data.ringkasan_text}
          </p>
          <p className="mt-4 text-sm text-muted">
            Dipublikasikan: {formatDateTime(summary.data.published_at)}
          </p>
        </Card>
      )}
    </Section>
  );
}

function RainSection() {
  const rain = usePublicData<RainData>("/publik/cuaca-terkini");

  return (
    <Section title="Info Curah Hujan" subtitle="Ringkasan periode dasarian terkini.">
      {rain.loading ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
        </div>
      ) : rain.error ? (
        <SectionError message={rain.error} />
      ) : !rain.data ? (
        <EmptyCard message={rain.message} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <Metric label="Total Curah Hujan" value={`${rain.data.curah_hujan.total_mm} mm`} />
          </Card>
          <Card>
            <Metric label="Hari Hujan" value={`${rain.data.curah_hujan.jumlah_hari_hujan} hari`} />
          </Card>
          <Card>
            <Metric
              label={`Dasarian ${rain.data.periode.dasarian_ke}, ${rain.data.periode.bulan}/${rain.data.periode.tahun}`}
              value={rain.data.status_musim}
            />
          </Card>
        </div>
      )}
    </Section>
  );
}

function ContentSection() {
  const content = usePublicData<ContentItem[]>("/publik/konten");

  return (
    <Section title="Pengumuman & Tips" subtitle="Informasi aktif dari admin MyFarmer.">
      {content.loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : content.error ? (
        <SectionError message={content.error} />
      ) : !content.data || content.data.length === 0 ? (
        <EmptyCard message={content.message || "Belum ada pengumuman atau tips."} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {content.data.map((item) => {
            const isTips = item.tipe === "tips";
            return (
              <Card
                key={`${item.tipe}-${item.judul}`}
                className={isTips ? "border-primary/30 bg-success-subtle" : "border-wait/30 bg-warning-subtle"}
              >
                <p className={`text-xs font-semibold uppercase ${isTips ? "text-primary" : "text-wait"}`}>
                  {item.tipe}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{item.judul}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.isi}</p>
              </Card>
            );
          })}
        </div>
      )}
    </Section>
  );
}

export default function PublicHomePage() {
  return (
    <main className="bg-background px-4 py-8 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:gap-10">
        <section className="space-y-3">
          <p className="text-sm font-semibold text-primary">MyFarmer</p>
          <h1 className="max-w-3xl text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl">
            Pantau cuaca dan rekomendasi tanam padi terbaru.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted">
            Informasi dibuat ringkas agar mudah dipakai petani sebelum mengambil keputusan tanam.
          </p>
        </section>

        <WeatherSection />
        <RecommendationSection />
        <SummarySection />
        <RainSection />
        <ContentSection />
      </div>
    </main>
  );
}
