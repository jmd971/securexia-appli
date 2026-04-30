"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { ReactNode } from "react";
import { UserMenu } from "@/components/layout/UserMenu";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  match?: (pathname: string) => boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: <LayoutDashboard size={18} /> },
  { href: "/erp", label: "Parc ERP", icon: <Building2 size={18} />, match: p => p === "/erp" || p.startsWith("/erp/") },
  { href: "/previsite", label: "Pré-visites", icon: <ClipboardList size={18} />, match: p => p.startsWith("/previsite") },
  { href: "/prescriptions", label: "Prescriptions", icon: <ListChecks size={18} /> },
];

export function Sidebar({ user }: { user: { email: string; role: string } }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 flex-col border-r border-gray-200 bg-white lg:flex">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-white">
          <ShieldCheck size={20} />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-navy">
            SECURE<span className="text-accent">XIA</span>
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted">ERP Sécurité 360°</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(item => {
          const active = item.match ? item.match(pathname) : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-navy text-white"
                  : "text-gray-700 hover:bg-muted-light"
              }`}
            >
              <span className={active ? "text-white" : "text-muted"}>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-gray-100 p-3">
        <UserMenu email={user.email} role={user.role} />
        <div className="rounded-md bg-muted-light px-3 py-2 text-[11px] text-muted">
          Service managé — Les Abymes, Guadeloupe
        </div>
      </div>
    </aside>
  );
}
