"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { logout, type MeDTO } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type NavItem = {
  href: string;
  label: string;
};

type RoleShellProps = {
  title: string;
  user: MeDTO;
  tabs: NavItem[];
  children: ReactNode;
};

export function RoleShell({ title, user, tabs, children }: RoleShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            Cerrar sesion
          </Button>
        </div>
        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "border bg-background text-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <section>{children}</section>
    </div>
  );
}
