"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  { label: "Input Data Iklim", href: "/admin/data-iklim" },
  { label: "Proses Agregasi", href: "/admin/agregasi" },
  { label: 'Generate Ringkasan AI (Groq)', href: "/admin/ringkasan-ai" },
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
        setError(caught instanceof ApiError ? caught.message : "Dashboard gagal dimuat.");
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Ringkasan cepat kondisi data dan proses admin MyFarmer.
        </p>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats ? (
          <>
            <StatCard label="Data Iklim Harian" value={stats.climateTotal} />
            <StatCard label="Rule Aktif" value={stats.activeRules} />
            <StatCard label="Ringkasan AI Backend" value={stats.summaryStatus} />
            <StatCard
              label="Import Terakhir"
              value={stats.importStatus}
              description={stats.importDetail}
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="space-y-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Aksi Cepat</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex h-10 items-center justify-center rounded-control border border-transparent bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number | string;
  description?: string;
}) {
  return (
    <Card className="min-h-32">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-3 break-words text-3xl font-semibold capitalize">{value}</p>
      {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
    </Card>
  );
}
