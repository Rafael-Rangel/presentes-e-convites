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
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/convidados", label: "Convidados", icon: Users },
  { href: "/admin/convites", label: "Convites", icon: Mail },
  { href: "/admin/presentes", label: "Presentes", icon: Gift },
  { href: "/admin/configuracoes", label: "Ajustes", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass sticky top-2 z-30 rounded-2xl p-2 md:static md:flex md:h-full md:w-64 md:flex-col md:p-4">
      <div className="mb-0 hidden px-2 md:mb-6 md:block">
        <p className="font-display text-2xl text-terra-deep">Casamento</p>
        <p className="text-sm text-muted">Painel administrativo</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] md:flex-1 md:flex-col [&::-webkit-scrollbar]:hidden">
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
                "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition md:w-full",
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
        <form action={logoutAction} className="ml-auto shrink-0 md:ml-0 md:mt-4 md:w-full">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-ink/70 hover:bg-white/70 md:w-full"
          >
            <LogOut size={18} />
            Sair
          </button>
        </form>
      </nav>
    </aside>
  );
}
