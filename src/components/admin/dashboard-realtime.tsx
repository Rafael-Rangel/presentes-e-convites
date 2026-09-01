"use client";

import { StatCard } from "@/components/admin/stat-card";
import { isOpenDonation } from "@/lib/open-donation";
import { createClient } from "@/lib/supabase/client";
import { formatCpf, formatCurrency, formatPhoneBr } from "@/lib/utils";
import type { Gift, GiftContribution, Guest } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

type Props = {
  weddingId: string;
  initialGuests: Guest[];
  initialContributions: GiftContribution[];
  gifts: Gift[];
};

export function DashboardRealtime({
  weddingId,
  initialGuests,
  initialContributions,
  gifts,
}: Props) {
  const [guests, setGuests] = useState(initialGuests);
  const [contributions, setContributions] = useState(initialContributions);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`dashboard-${weddingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "guests",
          filter: `wedding_id=eq.${weddingId}`,
        },
        async () => {
          const { data } = await supabase
            .from("guests")
            .select("*")
            .eq("wedding_id", weddingId)
            .order("updated_at", { ascending: false });
          if (data) setGuests(data as Guest[]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gift_contributions",
          filter: `wedding_id=eq.${weddingId}`,
        },
        async () => {
          const { data } = await supabase
            .from("gift_contributions")
            .select("*")
            .eq("wedding_id", weddingId)
            .eq("payment_status", "paid")
            .order("paid_at", { ascending: false });
          if (data) setContributions(data as GiftContribution[]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [weddingId]);

  const stats = useMemo(() => {
    const total = guests.length;
    const sent = guests.filter((g) => g.invitation_status === "sent").length;
    const accessed = guests.filter((g) => g.first_accessed_at).length;
    const confirmed = guests.filter((g) => g.confirmation_status === "confirmed").length;
    const declined = guests.filter((g) => g.confirmation_status === "declined").length;
    const raised = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
    return { total, sent, accessed, confirmed, declined, raised, gifts: contributions.length };
  }, [guests, contributions]);

  const latestConfirmations = guests
    .filter((g) => g.confirmation_status !== "pending")
    .slice(0, 5);

  const latestGifts = contributions.slice(0, 5);
  const giftNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const gift of gifts) {
      map.set(
        gift.id,
        isOpenDonation(gift) ? "Doação" : gift.name,
      );
    }
    return map;
  }, [gifts]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl text-terra-deep">Dashboard</h1>
        <p className="mt-1 text-muted">Atualização em tempo real</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de convidados" value={stats.total} />
        <StatCard label="Convites enviados" value={stats.sent} />
        <StatCard label="Convites acessados" value={stats.accessed} />
        <StatCard
          label="Confirmações"
          value={stats.confirmed}
          hint={`${stats.declined} recusas`}
        />
        <StatCard label="Presentes recebidos" value={stats.gifts} />
        <StatCard label="Valor arrecadado" value={formatCurrency(stats.raised)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-black/5 bg-white/60 p-4">
          <h2 className="font-display text-2xl text-serene-deep">Últimas confirmações</h2>
          <ul className="mt-4 space-y-3">
            {latestConfirmations.length === 0 ? (
              <li className="text-sm text-muted">Nenhuma confirmação ainda.</li>
            ) : (
              latestConfirmations.map((g) => (
                <li key={g.id} className="flex items-center justify-between text-sm">
                  <span>{g.name}</span>
                  <span
                    className={
                      g.confirmation_status === "confirmed"
                        ? "text-emerald-700"
                        : "text-red-700"
                    }
                  >
                    {g.confirmation_status === "confirmed" ? "Confirmado" : "Não vai"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-black/5 bg-white/60 p-4">
          <h2 className="font-display text-2xl text-serene-deep">Últimos presentes</h2>
          <ul className="mt-4 space-y-3">
            {latestGifts.length === 0 ? (
              <li className="text-sm text-muted">Nenhum presente pago ainda.</li>
            ) : (
              latestGifts.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium text-ink">{c.payer_name}</span>
                    <p className="text-[11px] text-muted">
                      {giftNameById.get(c.gift_id) || "Presente"}
                      {c.payment_method === "pix" ? " · Pix" : " · Cartão"}
                    </p>
                    <p className="text-[11px] text-muted">
                      {c.payer_cpf ? `CPF ${formatCpf(c.payer_cpf)}` : "CPF não informado"}
                      {" · "}
                      {c.payer_phone
                        ? formatPhoneBr(c.payer_phone)
                        : "telefone não informado"}
                    </p>
                  </div>
                  <span className="shrink-0 text-terra-deep">
                    {formatCurrency(Number(c.amount))}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
