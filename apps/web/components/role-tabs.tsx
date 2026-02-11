"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Role = "guest" | "athlete" | "coach" | "admin";

type TabItem = {
  href: string;
  label: string;
};

const tabsByRole: Record<Role, TabItem[]> = {
  guest: [
    { href: "/login", label: "Login" },
    { href: "/register/invite", label: "Invite Register" },
  ],
  athlete: [{ href: "/athlete", label: "Athlete" }],
  coach: [{ href: "/coach", label: "Coach" }],
  admin: [{ href: "/admin", label: "Admin" }],
};

function resolveRole(pathname: string): Role {
  if (pathname.startsWith("/athlete")) return "athlete";
  if (pathname.startsWith("/coach")) return "coach";
  if (pathname.startsWith("/admin")) return "admin";
  return "guest";
}

export function RoleTabs() {
  const pathname = usePathname();
  const role = resolveRole(pathname);

  return (
    <nav aria-label="Role tabs" className="w-full border-b border-border bg-card/80 px-4 py-3 backdrop-blur">
      <ul className="mx-auto flex max-w-4xl flex-wrap gap-2">
        {tabsByRole[role].map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "inline-flex rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
