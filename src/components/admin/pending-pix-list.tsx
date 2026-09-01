"use client";

import { confirmPixContributionAction } from "@/actions/gifts";
import { Button } from "@/components/ui/button";
import { formatCpf, formatCurrency, formatPhoneBr } from "@/lib/utils";
import type { GiftContribution } from "@/lib/types";
import { useTransition } from "react";
import { toast } from "sonner";

export function PendingPixList({ items }: { items: GiftContribution[] }) {
  const [pending, startTransition] = useTransition();

  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
      <h2 className="font-display text-2xl text-terra-deep">Pix Nubank a confirmar</h2>
      <p className="mt-1 text-sm text-muted">
        Confira o extrato e marque quando o valor cair.
      </p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/80 px-3 py-2.5 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium text-ink">{item.payer_name}</p>
              <p className="text-[11px] text-muted">
                {formatCurrency(Number(item.amount))}
                {item.payer_cpf ? ` · CPF ${formatCpf(item.payer_cpf)}` : ""}
                {item.payer_phone ? ` · ${formatPhoneBr(item.payer_phone)}` : ""}
              </p>
            </div>
            <Button
              size="sm"
              type="button"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await confirmPixContributionAction(item.id);
                  if (result.error) toast.error(result.error);
                  else toast.success("Pix confirmado");
                });
              }}
            >
              Confirmar
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
