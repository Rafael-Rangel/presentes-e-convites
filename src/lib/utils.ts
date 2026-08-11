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

export function whatsappShareUrl(phone: string | null | undefined, message: string) {
  const digits = (phone || "").replace(/\D/g, "");
  const base = digits
    ? `https://wa.me/55${digits.replace(/^55/, "")}`
    : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}
