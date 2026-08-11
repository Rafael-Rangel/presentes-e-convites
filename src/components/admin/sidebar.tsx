"use client";

import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";
import {
  Gift,
  LayoutDashboard,
  Mail,
  Settings,
  Users,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/convidados", label: "Convidados", icon: Users },
  { href: "/admin/convites", label: "Convites", icon: Mail },
  { href: "/admin/presentes", label: "Presentes", icon: Gift },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass flex h-full w-full flex-col rounded-2xl p-4 md:w-64">
      <div className="mb-6 px-2">
        <p className="font-display text-2xl text-terra-deep">Casamento</p>
        <p className="text-sm text-muted">Painel administrativo</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-terra text-white"
                  : "text-ink/80 hover:bg-white/70",
              )}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <form action={logoutAction}>
        <button
          type="submit"
          className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/70 hover:bg-white/70"
        >
          <LogOut size={18} />
          Sair
        </button>
      </form>
    </aside>
  );
}
