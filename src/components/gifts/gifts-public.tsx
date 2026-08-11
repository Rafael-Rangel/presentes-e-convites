"use client";

import { GiftCheckout } from "@/components/gifts/gift-checkout";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { HERO_PHOTO } from "@/lib/wedding-media";
import type { GiftWithProgress } from "@/lib/types";
import { Gift } from "lucide-react";
import { useMemo, useState } from "react";

type Props = {
  gifts: GiftWithProgress[];
  guestSlug?: string | null;
  guestName?: string | null;
  coupleNames: string;
};

function GiftCard({
  gift,
  urgent = false,
  onSelect,
}: {
  gift: GiftWithProgress;
  urgent?: boolean;
  onSelect: (gift: GiftWithProgress) => void;
}) {
  const remaining = Math.max(0, Number(gift.price) - gift.amount_raised);
  const complete = gift.percent >= 100 || gift.status === "completed";

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white/80 ${
        urgent
          ? "border-emerald-500/40 bg-emerald-50/80 shadow-[0_6px_18px_rgba(16,185,129,0.18)]"
          : "border-black/5"
      }`}
    >
      {gift.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={gift.image_url}
          alt={gift.name}
          className="h-24 w-full object-cover sm:h-28"
        />
      ) : (
        <div className="flex h-24 items-center justify-center bg-sand-deep text-xs text-muted sm:h-28">
          {gift.category || "Presente"}
        </div>
      )}

      <div className="space-y-2 p-2.5 sm:p-3">
        {urgent ? (
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Urgente
          </p>
        ) : null}

        <div className="min-w-0">
          <h2 className="font-display text-[15px] leading-tight text-ink sm:text-base">
            {gift.name}
          </h2>
          <p
            className={`mt-0.5 text-xs font-semibold ${
              urgent ? "text-emerald-700" : "text-terra-deep"
            }`}
          >
            {formatCurrency(Number(gift.price))}
          </p>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-[10px] text-muted">
            <span>{Math.round(gift.percent)}%</span>
            <span>
              {complete ? "Completo" : formatCurrency(remaining)}
            </span>
          </div>
          <div
            className={`progress-track h-1.5 rounded-full ${
              urgent ? "bg-emerald-100" : ""
            }`}
          >
            <div
              className={`h-full rounded-full ${
                urgent
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-700"
                  : "progress-fill"
              }`}
              style={{ width: `${Math.min(100, gift.percent)}%` }}
            />
          </div>
        </div>

        <Button
          size="sm"
          className={`btn-press w-full !px-2 !py-1.5 text-xs ${
            urgent ? "!bg-gradient-to-br !from-emerald-500 !to-emerald-700" : ""
          }`}
          disabled={complete}
          onClick={() => onSelect(gift)}
        >
          {complete ? (
            "Completo"
          ) : (
            <>
              <Gift size={14} />
              Presentear
            </>
          )}
        </Button>
      </div>
    </article>
  );
}

export function GiftsPublic({ gifts, guestSlug, guestName, coupleNames }: Props) {
  const [selected, setSelected] = useState<GiftWithProgress | null>(null);

  const { priority, others } = useMemo(() => {
    const prioritized = gifts
      .filter((g) => g.is_priority)
      .sort((a, b) => Number(b.price) - Number(a.price));
    const priorityIds = new Set(prioritized.map((g) => g.id));
    return {
      priority: prioritized,
      others: gifts
        .filter((g) => !priorityIds.has(g.id))
        .sort((a, b) => Number(b.price) - Number(a.price)),
    };
  }, [gifts]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-3 py-5 sm:px-4 sm:py-8">
      <div className="mb-4 overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_PHOTO}
          alt={coupleNames}
          className="h-28 w-full object-cover sm:h-40"
        />
      </div>

      <div className="mb-5 text-center">
        <p className="text-[10px] uppercase tracking-[0.28em] text-serene-deep">
          {coupleNames}
        </p>
        <h1 className="mt-1 font-display text-3xl text-terra-deep sm:text-4xl">
          Presentes
        </h1>
        <p className="mx-auto mt-2 max-w-md text-xs text-muted sm:text-sm">
          Contribua com o valor total ou parcial. Itens em verde são prioridade.
        </p>
        {guestName ? (
          <p className="mt-2 text-xs text-serene-deep">
            Presenteando como <strong>{guestName}</strong>
          </p>
        ) : null}
      </div>

      {gifts.length === 0 ? (
        <p className="text-center text-muted">Em breve a lista estará disponível.</p>
      ) : (
        <div className="space-y-7">
          {priority.length > 0 ? (
            <section>
              <div className="mb-3 text-center">
                <h2 className="font-display text-xl text-emerald-700 sm:text-2xl">
                  Prioridade da casa
                </h2>
                <p className="text-[11px] text-muted">
                  Geladeira, fogão, máquina, cama, sofá, mesa e cadeiras
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {priority.map((gift) => (
                  <GiftCard
                    key={gift.id}
                    gift={gift}
                    urgent
                    onSelect={setSelected}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {others.length > 0 ? (
            <section>
              <div className="mb-3 text-center">
                <h2 className="font-display text-xl text-serene-deep sm:text-2xl">
                  Demais presentes
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {others.map((gift) => (
                  <GiftCard key={gift.id} gift={gift} onSelect={setSelected} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      {selected ? (
        <GiftCheckout
          gift={selected}
          guestSlug={guestSlug}
          guestName={guestName}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </main>
  );
}
