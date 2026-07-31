"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { AdminIcon, ConfirmDialog } from "@/components/admin/AdminUI";
import { Button, Spinner } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

type MenuItem = { label: string; href: string; icon: Parameters<typeof AdminIcon>[0]["name"] };
type MenuGroup = { label: string; items: MenuItem[] };

const menuGroups: MenuGroup[] = [
  { label: "Ringkasan", items: [{ label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" }] },
  { label: "Data dan Proses", items: [
    { label: "Data Iklim", href: "/admin/data-iklim", icon: "climate" },
    { label: "Agregasi", href: "/admin/agregasi", icon: "process" },
    { label: "Rule Rekomendasi", href: "/admin/rules", icon: "rules" },
    { label: "Rekomendasi", href: "/admin/rekomendasi", icon: "recommendation" },
  ] },
  { label: "Publikasi", items: [
    { label: "Ringkasan AI", href: "/admin/ringkasan-ai", icon: "ai" },
    { label: "Konten", href: "/admin/konten", icon: "content" },
  ] },
  { label: "Sistem", items: [{ label: "Log Import", href: "/admin/log-import", icon: "import" }] },
];

const superAdminItems: MenuItem[] = [
  { label: "Kelola User", href: "/admin/users", icon: "users" },
  { label: "Audit Log", href: "/admin/audit-log", icon: "audit" },
];

function roleLabel(role: string | null) {
  return role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : "Pengguna";
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, isAuthenticated, logout, nama_role, user } = useAuth();
  const isLoginRoute = pathname === "/admin/login";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.replace("/admin/login");
  }

  useEffect(() => {
    const closeSidebar = window.setTimeout(() => setSidebarOpen(false), 0);
    return () => window.clearTimeout(closeSidebar);
  }, [pathname]);

  useEffect(() => {
    if (isReady && !isAuthenticated && !isLoginRoute) router.replace("/admin/login");
  }, [isAuthenticated, isLoginRoute, isReady, router]);

  if (isLoginRoute) return <>{children}</>;

  if (!isReady || !isAuthenticated) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background">
        <Spinner label="Memeriksa sesi admin" />
      </main>
    );
  }

  const visibleGroups = nama_role === "super_admin"
    ? menuGroups.map((group) => group.label === "Sistem" ? { ...group, items: [...group.items, ...superAdminItems] } : group)
    : menuGroups;
  const activeItem = visibleGroups.flatMap((group) => group.items).find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      {sidebarOpen ? <button type="button" className="fixed inset-0 z-40 bg-foreground/35 md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu navigasi" /> : null}

      <aside className={[
        "fixed inset-y-0 left-0 z-50 flex w-68 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 md:sticky md:top-0 md:h-svh md:translate-x-0 md:transition-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}>
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Image src="/logo_bmkg.png" alt="Logo BMKG" width={42} height={42} className="size-10 shrink-0 object-contain" priority />
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-tight text-primary">MyFarmer</p>
                <p className="truncate text-xs text-muted">Panel Administrasi</p>
              </div>
            </div>
            <button type="button" className="inline-flex size-9 items-center justify-center rounded-control text-muted hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu">
              <AdminIcon name="close" />
            </button>
          </div>
          <div className="mt-4 rounded-control border border-border bg-background px-3 py-2.5">
            <p className="truncate text-sm font-medium">{user?.nama_lengkap}</p>
            <p className="mt-0.5 text-xs text-muted">{roleLabel(nama_role)}</p>
          </div>
        </div>

        <nav aria-label="Navigasi admin" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted/80">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={[
                      "flex items-center gap-3 rounded-control border-l-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      active ? "border-primary bg-success-subtle text-primary" : "border-transparent text-muted hover:bg-background hover:text-foreground",
                    ].join(" ")}>
                      <AdminIcon name={item.icon} className="size-[18px] shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => setLogoutDialogOpen(true)}>
            <AdminIcon name="logout" className="size-4" />
            Keluar
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 xl:px-10">
        <div className="mb-5 flex items-center gap-3 border-b border-border pb-4 md:hidden">
          <button type="button" className="inline-flex size-10 items-center justify-center rounded-control border border-border bg-surface text-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" onClick={() => setSidebarOpen(true)} aria-label="Buka menu">
            <AdminIcon name="menu" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-primary">{activeItem?.label ?? "MyFarmer Admin"}</p>
            <p className="truncate text-xs text-muted">{user?.nama_lengkap} · {roleLabel(nama_role)}</p>
          </div>
        </div>
        <nav aria-label="Breadcrumb" className="mb-5 hidden items-center gap-2 text-xs text-muted md:flex">
          <span>Panel Admin</span>
          <AdminIcon name="arrow" className="size-3.5" />
          <span className="font-medium text-foreground">{activeItem?.label ?? "Halaman Admin"}</span>
        </nav>
        <div className="mx-auto w-full max-w-[1480px]">{children}</div>
      </main>

      <ConfirmDialog
        open={logoutDialogOpen}
        title="Keluar dari panel admin?"
        confirmLabel="Keluar"
        busy={loggingOut}
        destructive={false}
        showNotice={false}
        onCancel={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
