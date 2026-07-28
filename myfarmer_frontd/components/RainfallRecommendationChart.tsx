"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

import { Skeleton } from "@/components/ui";
import { ApiError, apiGet } from "@/lib/apiClient";

type RecommendationStatus =
  | "optimal_tanam"
  | "tunggu"
  | "tidak_disarankan"
  | null;

type RainfallPeriod = {
  periode: {
    tahun: number;
    bulan: number;
    periode_ke: number;
    label: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
  };
  curah_hujan: {
    total_mm: number;
    jumlah_hari_hujan: number;
    jumlah_hari_valid: number;
    jumlah_hari_missing: number;
  };
  rekomendasi: {
    status: RecommendationStatus;
    label: string;
    tanggal_evaluasi: string | null;
  };
};

type RainfallChartResponse = {
  stasiun: {
    nama: string;
    kode_wmo: string | null;
  };
  rule: {
    nama: string;
    batas_curah_hujan_mm: number | null;
    jumlah_periode_berturut: number | null;
    batas_total_alternatif_mm: number | null;
    kriteria_hari_hujan_aktif: boolean | null;
    batas_hari_hujan: number | null;
  } | null;
  jumlah_periode: number;
  periode: RainfallPeriod[];
};

type ChartPoint = {
  shortLabel: string;
  fullLabel: string;
  rainfall: number;
  rainyDays: number;
  validDays: number;
  missingDays: number;
  status: RecommendationStatus;
  recommendationLabel: string;
};

type RainfallRecommendationChartProps = {
  className?: string;
  periodCount?: number;
  accent?: "default" | "green";
};

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 1,
});

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const statusStyles: Record<Exclude<RecommendationStatus, null> | "unavailable", string> = {
  optimal_tanam: "border-[#2f7d32]/20 bg-[#eaf5ea] text-[#2f7d32]",
  tunggu: "border-[#a16207]/20 bg-[#fff6e5] text-[#8a5706]",
  tidak_disarankan: "border-[#a24646]/20 bg-[#f8eaea] text-[#a24646]",
  unavailable: "border-[#d9d9de] bg-[#f5f5f6] text-[#66666e]",
};

const statusColors: Record<Exclude<RecommendationStatus, null> | "unavailable", string> = {
  optimal_tanam: "#2f7d32",
  tunggu: "#d6972a",
  tidak_disarankan: "#a24646",
  unavailable: "#a9a9b0",
};

const statusLegend = [
  { status: "optimal_tanam" as const, label: "Baik untuk tanam" },
  { status: "tunggu" as const, label: "Pantau dahulu" },
  { status: "tidak_disarankan" as const, label: "Tidak disarankan" },
  { status: "unavailable" as const, label: "Belum dianalisis" },
];

function getStatusKey(status: RecommendationStatus) {
  return status ?? "unavailable";
}

function shortPeriodLabel(period: RainfallPeriod["periode"]) {
  const startDay = Number(period.tanggal_mulai.slice(8, 10));
  const endDay = Number(period.tanggal_selesai.slice(8, 10));
  const month = monthNames[period.bulan - 1] ?? String(period.bulan);

  return `${startDay}\u2013${endDay} ${month}`;
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload.length) return null;

  const point = payload[0]?.payload as ChartPoint | undefined;
  if (!point) return null;

  const statusKey = getStatusKey(point.status);

  return (
    <div className="min-w-[250px] rounded-[14px] border border-[#e3e3e7] bg-white p-4 text-[#1c1c1e] shadow-[0_12px_32px_rgba(28,28,30,0.14)]">
      <p className="text-[13px] font-semibold">{point.fullLabel}</p>
      <div className="mt-3 space-y-2 text-[12px]">
        <div className="flex items-center justify-between gap-6">
          <span className="text-[#77777f]">Curah hujan</span>
          <span className="font-semibold">{formatNumber(point.rainfall)} mm</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-[#77777f]">Hari hujan</span>
          <span className="font-semibold">{point.rainyDays} hari</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-[#77777f]">Data tercatat</span>
          <span className="font-semibold">
            {point.validDays}/{point.validDays + point.missingDays} hari
          </span>
        </div>
      </div>
      <div className={`mt-3 rounded-[9px] border px-3 py-2 text-[12px] font-medium ${statusStyles[statusKey]}`}>
        {point.recommendationLabel}
      </div>
    </div>
  );
}

function ChartSkeleton({ className = "" }: { className?: string }) {
  return (
    <section
      aria-busy="true"
      aria-label="Memuat grafik curah hujan"
      className={`rounded-[22px] border border-black/[0.04] bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="space-y-3">
          <Skeleton className="h-5 w-64 max-w-full" />
          <Skeleton className="h-4 w-48 max-w-full" />
        </div>
        <Skeleton className="h-12 w-64 max-w-full rounded-[12px]" />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Skeleton className="h-16 rounded-[14px]" />
        <Skeleton className="h-16 rounded-[14px]" />
        <Skeleton className="h-16 rounded-[14px]" />
      </div>
      <Skeleton className="mt-6 h-[320px] rounded-[16px]" />
    </section>
  );
}

export function RainfallRecommendationChart({
  className = "",
  periodCount = 12,
  accent = "default",
}: RainfallRecommendationChartProps) {
  const normalizedPeriodCount = Math.min(36, Math.max(1, Math.round(periodCount)));
  const [data, setData] = useState<RainfallChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadChart() {
      setLoading(true);
      setError("");

      try {
        const response = await apiGet<RainfallChartResponse | null>(
          `/publik/grafik-curah-hujan?jumlah_periode=${normalizedPeriodCount}`,
          { signal: controller.signal },
        );

        if (!controller.signal.aborted) setData(response.data);
      } catch (caught) {
        if (controller.signal.aborted) return;

        setData(null);
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Grafik curah hujan belum dapat dimuat.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadChart();
    return () => controller.abort();
  }, [normalizedPeriodCount, requestKey]);

  const greenAccent = accent === "green";

  if (loading) return <ChartSkeleton className={className} />;

  if (error) {
    return (
      <section
        className={`rounded-[22px] border border-[#ead4d4] bg-white p-5 shadow-sm sm:p-6 ${className}`}
      >
        <p className="text-[16px] font-semibold text-[#1c1c1e]">
          Grafik curah hujan belum dapat ditampilkan
        </p>
        <p className="mt-1 text-[13px] leading-6 text-[#77777f]">{error}</p>
        <button
          type="button"
          onClick={() => setRequestKey((key) => key + 1)}
          className={`mt-4 inline-flex h-10 items-center justify-center rounded-[10px] px-4 text-[13px] font-semibold text-white transition-colors focus:outline-none focus:ring-2 ${greenAccent ? "bg-[#16a34a] hover:bg-[#15803d] focus:ring-[#16a34a]/30" : "bg-[#1c1c1e] hover:bg-[#343438] focus:ring-[#4a4ff7]/30"}`}
        >
          Coba lagi
        </button>
      </section>
    );
  }

  if (!data || data.periode.length === 0) {
    return (
      <section
        className={`rounded-[22px] border border-black/[0.04] bg-white p-6 text-center shadow-sm ${className}`}
      >
        <div className={`mx-auto flex size-12 items-center justify-center rounded-full ${greenAccent ? "bg-[#dcfce7]" : "bg-[#f0f0ff]"}`}>
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke={greenAccent ? "#16a34a" : "#4a4ff7"} strokeWidth="2" strokeLinecap="round"><path d="M12 2v6M8 4v8M16 4v6" /></svg>
        </div>
        <p className="mt-4 text-[16px] font-semibold text-[#1c1c1e]">
          Data curah hujan belum tersedia
        </p>
        <p className="mt-1 text-[13px] text-[#77777f]">
          Grafik akan tampil setelah data 10 harian selesai diproses.
        </p>
      </section>
    );
  }

  const chartData: ChartPoint[] = data.periode.map((item) => ({
    shortLabel: shortPeriodLabel(item.periode),
    fullLabel: item.periode.label,
    rainfall: Number(item.curah_hujan.total_mm) || 0,
    rainyDays: Number(item.curah_hujan.jumlah_hari_hujan) || 0,
    validDays: Number(item.curah_hujan.jumlah_hari_valid) || 0,
    missingDays: Number(item.curah_hujan.jumlah_hari_missing) || 0,
    status: item.rekomendasi.status,
    recommendationLabel: item.rekomendasi.label,
  }));
  const latest = chartData[chartData.length - 1];
  const latestStatusKey = getStatusKey(latest.status);
  const threshold = data.rule?.batas_curah_hujan_mm ?? null;
  const chartMinWidth = Math.max(720, chartData.length * 66);

  return (
    <section
      className={`rounded-[22px] border border-black/[0.04] bg-white p-5 text-[#1c1c1e] shadow-sm sm:p-6 ${className}`}
    >
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex size-11 shrink-0 items-center justify-center rounded-[13px] ${greenAccent ? "bg-[#dcfce7]" : "bg-[#f0f0ff]"}`}>
                      <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke={greenAccent ? "#16a34a" : "#4a4ff7"} strokeWidth="2" strokeLinecap="round"><path d="M12 2v6M8 4v8M16 4v6" /></svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-[18px] font-semibold leading-7">
              Curah Hujan 10 Harian &amp; Rekomendasi Tanam
            </h2>
            <p className="mt-0.5 truncate text-[12px] text-[#8c8c94] sm:text-[13px]">
              {data.stasiun.nama}
              {data.stasiun.kode_wmo ? ` \u2022 WMO ${data.stasiun.kode_wmo}` : ""}
            </p>
          </div>
        </div>

        <div className="max-w-xl lg:text-right">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8c8c94]">
            Rekomendasi periode terbaru
          </p>
          <span
            className={`inline-flex rounded-[10px] border px-3 py-2 text-[12px] font-semibold leading-5 ${statusStyles[latestStatusKey]}`}
          >
            {latest.recommendationLabel}
          </span>
        </div>
      </div>

      <div className={`mt-5 grid overflow-hidden rounded-[15px] border border-[#ececee] sm:grid-cols-3 ${greenAccent ? "bg-[#f0f9f3]" : "bg-[#fafafa]"}`}>
        <Metric
          label="Curah hujan terbaru"
          value={`${formatNumber(latest.rainfall)} mm`}
        />
        <Metric label="Hari hujan" value={`${latest.rainyDays} hari`} />
        <Metric
          label="Kelengkapan data"
          value={`${latest.validDays}/${latest.validDays + latest.missingDays} hari`}
          className="sm:border-l"
        />
      </div>

      <div className="mt-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="text-[13px] font-semibold">Pergerakan {data.jumlah_periode} periode terakhir</p>
          <p className="mt-0.5 text-[11px] text-[#9999a1]">
            Tinggi batang menunjukkan jumlah curah hujan.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[#707078]">
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-5 rounded-full bg-[#4a4ff7]" />
            Hari hujan
          </span>
          {threshold !== null ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-5 border-t-2 border-dashed border-[#5f6b5b]" />
              Batas {formatNumber(threshold)} mm
            </span>
          ) : null}
        </div>
      </div>

      <div className="-mx-2 mt-2 overflow-x-auto pb-2">
        <div className="h-[330px] px-2" style={{ minWidth: chartMinWidth }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 24, right: 4, bottom: 4, left: -10 }}
              accessibilityLayer
            >
              <CartesianGrid
                vertical={false}
                stroke={greenAccent ? "#e2ede6" : "#ececee"}
                strokeDasharray="4 4"
              />
              <XAxis
                dataKey="shortLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#77777f", fontSize: 11 }}
                tickMargin={12}
                interval={0}
              />
              <YAxis
                yAxisId="rainfall"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9999a1", fontSize: 11 }}
                tickFormatter={(value: number) => formatNumber(value)}
                width={48}
              />
              <YAxis
                yAxisId="days"
                orientation="right"
                domain={[0, 12]}
                ticks={[0, 3, 6, 9, 12]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9999a1", fontSize: 11 }}
                width={30}
              />
              <Tooltip
                content={ChartTooltip}
                cursor={{ fill: "#f4f4f6", radius: 8 }}
                animationDuration={180}
              />
              {threshold !== null ? (
                <ReferenceLine
                  yAxisId="rainfall"
                  y={threshold}
                  stroke="#5f6b5b"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                />
              ) : null}
              <Bar
                yAxisId="rainfall"
                dataKey="rainfall"
                name="Curah hujan"
                maxBarSize={42}
                radius={[8, 8, 2, 2]}
                isAnimationActive={false}
              >
                {chartData.map((point) => (
                  <Cell
                    key={`${point.shortLabel}-${point.fullLabel}`}
                    fill={statusColors[getStatusKey(point.status)]}
                  />
                ))}
              </Bar>
              <Line
                yAxisId="days"
                type="monotone"
                dataKey="rainyDays"
                name="Hari hujan"
                stroke="#4a4ff7"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#ffffff", stroke: "#4a4ff7", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "#4a4ff7", stroke: "#ffffff", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#ececee] pt-4">
        <span className="text-[11px] font-medium text-[#77777f]">Warna batang:</span>
        {statusLegend.map((item) => (
          <span
            key={item.status}
            className="inline-flex items-center gap-1.5 text-[11px] text-[#707078]"
          >
            <span
              className="size-2.5 rounded-[3px]"
              style={{ backgroundColor: statusColors[item.status] }}
            />
            {item.label}
          </span>
        ))}
      </div>

      <p className="mt-4 text-[11px] leading-5 text-[#8c8c94]">
        {data.rule
          ? `Rekomendasi dihitung oleh backend menggunakan ${data.rule.nama}${
              threshold !== null ? ` dengan acuan ${formatNumber(threshold)} mm` : ""
            }${
              data.rule.jumlah_periode_berturut
                ? ` selama ${data.rule.jumlah_periode_berturut} periode berturut-turut`
                : ""
            }.`
          : "Rule rekomendasi aktif belum tersedia; data curah hujan tetap ditampilkan."}
      </p>
    </section>
  );
}

function Metric({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`border-[#ececee] px-4 py-3.5 sm:not-first:border-l ${className}`}>
      <p className="text-[11px] text-[#8c8c94]">{label}</p>
      <p className="mt-1 text-[16px] font-semibold">{value}</p>
    </div>
  );
}
