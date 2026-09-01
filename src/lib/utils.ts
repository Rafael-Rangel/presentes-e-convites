import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatCpf(value: string | null | undefined) {
  const d = (value || "").replace(/\D/g, "");
  if (d.length !== 11) return value || "";
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatPhoneBr(value: string | null | undefined) {
  const d = (value || "").replace(/\D/g, "");
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return value || "";
}

export function whatsappShareUrl(phone: string | null | undefined, message: string) {
  const digits = (phone || "").replace(/\D/g, "");
  const base = digits
    ? `https://wa.me/55${digits.replace(/^55/, "")}`
    : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}
