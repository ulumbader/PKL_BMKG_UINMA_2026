"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { RainfallRecommendationChart } from "@/components/RainfallRecommendationChart";
import { AdminIcon, PageHeader, StatusBadge } from "@/components/admin/AdminUI";
import { Alert, Card, Skeleton } from "@/components/ui";
import { ApiError, apiGet } from "@/lib/apiClient";

type Paginated<T> = {
  data?: T[];
  total?: number;
};

type ListResult<T> = T[] | Paginated<T>;

type Rule = {
  is_active?: boolean;
};

type AiSummary = {
  status?: string;
};

type ImportLog = {
  status?: string;
  sumber?: string;
  jumlah_data_masuk?: number;
};

type DashboardStats = {
  climateTotal: number;
  activeRules: number;
  summaryStatus: string;
  importStatus: string;
  importDetail: string;
};

const quickActions = [
  { label: "Input Data Iklim", description: "Tambah observasi harian atau import CSV.", href: "/admin/data-iklim", icon: "climate" as const },
  { label: "Proses Agregasi", description: "Olah data harian menjadi periode dasarian.", href: "/admin/agregasi", icon: "process" as const },
  { label: "Buat Ringkasan AI", description: "Generate draft ringkasan melalui backend Groq.", href: "/admin/ringkasan-ai", icon: "ai" as const },
];

function listItems<T>(result: ListResult<T>) {
  return Array.isArray(result) ? result : result.data ?? [];
}

function listTotal<T>(result: ListResult<T>) {
  return Array.isArray(result) ? result.length : result.total ?? result.data?.length ?? 0;
}

function displayStatus(value?: string) {
  if (!value) return "Belum ada";
  return value.replace(/_/g, " ");
}

export default function Page() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [climate, rules, summaries, imports] = await Promise.all([
          apiGet<Paginated<unknown>>("/admin/data-iklim?per_page=1"),
          apiGet<Rule[]>("/admin/rules?is_active=1"),
          apiGet<ListResult<AiSummary>>("/admin/ringkasan?per_page=1"),
          apiGet<Paginated<ImportLog>>("/admin/log-import?per_page=1"),
        ]);

        if (!active) return;

        const latestSummary = listItems(summaries.data)[0];
        const latestImport = listItems(imports.data)[0];
        const activeRules = rules.data.filter((rule) => rule.is_active ?? true).length;

        setStats({
          climateTotal: listTotal(climate.data),
          activeRules,
          summaryStatus: displayStatus(latestSummary?.status),
          importStatus: displayStatus(latestImport?.status),
          importDetail: latestImport
            ? `${latestImport.sumber ?? "import"} - ${latestImport.jumlah_data_masuk ?? 0} data`
            : "Belum ada import",
        });
        setError("");
      } catch (caught) {
        if (!active) return;
        setStats(null);
        setError(caught instanceof ApiError ? caught.message : "Dashboard gagal dimuat.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Pantau kesiapan data, proses analisis, dan publikasi MyFarmer dalam satu ringkasan." />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats ? (
          <>
            <StatCard icon="database" label="Data Iklim Harian" value={stats.climateTotal} accent="success" />
            <StatCard icon="rules" label="Rule Aktif" value={stats.activeRules} accent="warning" />
            <StatCard icon="ai" label="Ringkasan AI" value={stats.summaryStatus} accent="info" />
            <StatCard
              icon="import"
              label="Import Terakhir"
              value={stats.importStatus}
              description={stats.importDetail}
              accent={stats.importStatus === "gagal" ? "danger" : "success"}
            />
          </>
        ) : loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="space-y-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))
        ) : null}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Aksi Cepat</h2>
          <p className="mt-1 text-sm text-muted">Jalur singkat ke pekerjaan admin yang paling sering digunakan.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex min-h-24 items-center gap-4 rounded-card border border-border bg-surface p-4 transition-colors hover:border-primary/35 hover:bg-success-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-control bg-success-subtle text-primary group-hover:bg-surface"><AdminIcon name={action.icon} /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{action.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">{action.description}</span>
              </span>
              <AdminIcon name="arrow" className="ml-auto size-4 shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      </section>

      <RainfallRecommendationChart />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
  accent,
}: {
  icon: "database" | "rules" | "ai" | "import";
  label: string;
  value: number | string;
  description?: string;
  accent: "success" | "warning" | "danger" | "info";
}) {
  return (
    <Card className="min-h-36 border-l-[3px] border-l-primary">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className="inline-flex size-9 items-center justify-center rounded-control bg-background text-primary"><AdminIcon name={icon} className="size-[18px]" /></span>
      </div>
      <div className="mt-3"><StatusBadge tone={accent}>{value}</StatusBadge></div>
      {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
    </Card>
  );
}
