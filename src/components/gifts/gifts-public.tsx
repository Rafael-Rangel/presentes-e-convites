"use client";

import { GiftCheckout } from "@/components/gifts/gift-checkout";
import { GiftCover } from "@/components/gifts/gift-cover";
import { Button } from "@/components/ui/button";
import { isOpenDonation } from "@/lib/open-donation";
import { cn } from "@/lib/utils";
import type { GiftWithProgress } from "@/lib/types";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Check, Flame, Gift, QrCode, Sparkles } from "lucide-react";
import { useMemo, useRef, useState } from "react";

gsap.registerPlugin(useGSAP);

type Props = {
  gifts: GiftWithProgress[];
  guestSlug?: string | null;
  guestName?: string | null;
  coupleNames: string;
};

type TabId = "all" | "priority" | string;

function GiftCard({
  gift,
  onSelect,
}: {
  gift: GiftWithProgress;
  onSelect: (gift: GiftWithProgress) => void;
}) {
  const gifted = gift.percent >= 100 || gift.status === "completed";
  const urgent = Boolean(gift.is_priority) && !gifted;
  const openDonation = isOpenDonation(gift);

  if (openDonation) {
    return (
      <article
        role="button"
        tabIndex={0}
        aria-label="Abrir doação Presente + Pix"
        className="g-card donation-card relative flex min-h-[10.5rem] cursor-pointer flex-col rounded-2xl sm:min-h-[12rem]"
        onClick={() => onSelect(gift)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(gift);
          }
        }}
      >
        <div className="flex flex-1 flex-col items-center justify-center px-2 pt-3">
          <span className="donation-icon" aria-hidden>
            <Gift size={28} strokeWidth={1.7} />
          </span>
          <p className="g-card-bit mt-1.5 text-center font-display text-[13px] leading-tight text-terra-deep sm:text-sm">
            Presente + Pix
          </p>
          <p className="g-card-bit mt-0.5 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-serene-deep">
            <QrCode size={10} aria-hidden />
            Personalizado
          </p>
        </div>
        <div className="p-2.5 pt-1 sm:p-3 sm:pt-1">
          <span className="g-card-btn btn-press btn-primary pointer-events-none relative z-0 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl !px-2 !py-1.5 text-xs font-medium select-none">
            <span className="btn-label">
              <Gift size={14} aria-hidden />
              Doação
            </span>
          </span>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "g-card relative rounded-2xl",
        gifted
          ? "gifted-card"
          : urgent
            ? "priority-card"
            : "overflow-hidden border border-[rgba(212,175,55,0.28)] bg-white/75 shadow-[0_6px_18px_rgba(63,93,114,0.08)] backdrop-blur-sm",
      )}
    >
      {gifted ? (
        <span className="g-card-bit gifted-tag">
          <Check size={12} strokeWidth={2.5} aria-hidden />
          Presenteado
        </span>
      ) : urgent ? (
        <span className="g-card-bit flame-tag">
          <span className="flame-icon" aria-hidden>
            <Flame size={12} />
          </span>
          Urgente
        </span>
      ) : gift.category ? (
        <span className="g-card-bit absolute left-2 top-2 z-10 inline-flex items-center rounded-full border border-[rgba(212,175,55,0.45)] bg-white/85 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-serene-deep backdrop-blur-sm">
          {gift.category}
        </span>
      ) : null}

      <div className="g-card-media">
        {gift.image_url ? (
          <div className="relative h-24 overflow-hidden sm:h-28">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gift.image_url}
              alt={gift.name}
              className={cn(
                "h-full w-full object-cover",
                gifted && "gifted-card-image",
              )}
            />
            <div
              className={cn(
                "pointer-events-none absolute inset-0",
                gifted
                  ? "gifted-media-overlay"
                  : "bg-gradient-to-t from-[rgba(42,36,32,0.18)] via-transparent to-[rgba(251,247,242,0.2)]",
              )}
            />
            {gifted ? (
              <span className="gifted-check-badge" aria-hidden>
                <Check size={22} strokeWidth={2.75} />
              </span>
            ) : null}
          </div>
        ) : (
          <div className="relative">
            <GiftCover
              name={gift.name}
              category={gift.category}
              urgent={urgent}
              gifted={gifted}
            />
            {gifted ? (
              <span className="gifted-check-badge gifted-check-badge--cover" aria-hidden>
                <Check size={22} strokeWidth={2.75} />
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div className="g-card-body space-y-2 p-2.5 sm:p-3">
        {gifted ? (
          <span className="g-card-bit gifted-chip">
            <Check size={10} strokeWidth={2.5} aria-hidden />
            Já presenteado
          </span>
        ) : urgent ? (
          <span className="g-card-bit inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-red-600">
            <Sparkles size={10} />
            Prioridade
          </span>
        ) : null}

        <div className="g-card-bit min-w-0">
          <h2 className="font-display text-[15px] leading-tight text-ink sm:text-base">
            {gift.name}
          </h2>
        </div>

        <Button
          size="sm"
          variant={gifted ? "secondary" : urgent ? "danger" : "primary"}
          className={cn(
            "g-card-btn btn-press w-full !px-2 !py-1.5 text-xs",
            gifted && "gifted-btn",
          )}
          disabled={gifted}
          onClick={() => onSelect(gift)}
        >
          {gifted ? (
            <span className="btn-label">
              <Check size={14} strokeWidth={2.5} aria-hidden />
              Presenteado
            </span>
          ) : (
            <span className="btn-label">
              <Gift size={14} aria-hidden />
              Valor livre
            </span>
          )}
        </Button>
      </div>
    </article>
  );
}

function animateGiftGrid(root: HTMLElement | null) {
  if (!root) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cards = root.querySelectorAll(".g-card");
  if (!cards.length) return;

  if (reduce) {
    gsap.set(cards, { clearProps: "all", opacity: 1 });
    gsap.set(".g-card-media, .g-card-bit, .g-card-btn", {
      clearProps: "all",
      opacity: 1,
    });
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: "power3.out" }, overwrite: true });
  tl.fromTo(
    cards,
    { opacity: 0, y: 28 },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.05,
      ease: "power2.out",
    },
  );

  cards.forEach((card, index) => {
    const bits = card.querySelectorAll(".g-card-media, .g-card-bit, .g-card-btn");
    if (!bits.length) return;
    tl.fromTo(
      bits,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.38,
        stagger: 0.04,
        ease: "power2.out",
      },
      0.12 + index * 0.05,
    );
  });
}

export function GiftsPublic({ gifts, guestSlug, guestName, coupleNames }: Props) {
  const root = useRef<HTMLElement>(null);
  const skipTabAnim = useRef(true);
  const [selected, setSelected] = useState<GiftWithProgress | null>(null);
  const [tab, setTab] = useState<TabId>("all");

  const catalog = useMemo(
    () => gifts.filter((g) => !isOpenDonation(g)),
    [gifts],
  );
  const openDonation = useMemo(
    () => gifts.find((g) => isOpenDonation(g)) || null,
    [gifts],
  );

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const gift of catalog) {
      const key = (gift.category || "Outros").trim() || "Outros";
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))
      .map(([name, count]) => ({ name, count }));
  }, [catalog]);

  const priority = useMemo(
    () =>
      catalog
        .filter((g) => g.is_priority)
        .sort((a, b) => Number(b.price) - Number(a.price)),
    [catalog],
  );

  const visible = useMemo(() => {
    let list = catalog;
    if (tab === "priority") list = priority;
    else if (tab !== "all") {
      list = catalog.filter(
        (g) => ((g.category || "Outros").trim() || "Outros") === tab,
      );
    }
    const sorted = [...list].sort((a, b) => {
      if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;
      return Number(b.price) - Number(a.price);
    });
    return openDonation ? [openDonation, ...sorted] : sorted;
  }, [catalog, openDonation, priority, tab]);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "all", label: "Todos", count: catalog.length + (openDonation ? 1 : 0) },
    ...(priority.length
      ? [{ id: "priority" as const, label: "Urgentes", count: priority.length }]
      : []),
    ...categories.map((c) => ({
      id: c.name,
      label: c.name,
      count: c.count,
    })),
  ];

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set(".g-fade, .g-rise, .g-card, .g-tab, .g-card-media, .g-card-bit, .g-card-btn", {
          clearProps: "all",
          opacity: 1,
        });
        return;
      }

      gsap.set(".g-fade", { opacity: 0 });
      gsap.set(".g-rise", { opacity: 0, y: 24 });
      gsap.set(".g-tab", { opacity: 0, y: 12 });
      gsap.set(".g-card", { opacity: 0, y: 28 });
      gsap.set(".g-card-media, .g-card-bit, .g-card-btn", { opacity: 0, y: 12 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(".g-fade", { opacity: 1, duration: 0.7, stagger: 0.07 })
        .to(
          ".g-rise",
          { opacity: 1, y: 0, duration: 0.65, stagger: 0.06 },
          0.1,
        )
        .to(
          ".g-tab",
          { opacity: 1, y: 0, duration: 0.42, stagger: 0.03 },
          0.22,
        );

      animateGiftGrid(root.current);
    },
    { scope: root },
  );

  useGSAP(
    () => {
      if (skipTabAnim.current) {
        skipTabAnim.current = false;
        return;
      }
      animateGiftGrid(root.current);
    },
    { scope: root, dependencies: [tab] },
  );

  return (
    <main ref={root} className="gifts-page relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(184,92,56,0.22)_0%,transparent_42%),radial-gradient(ellipse_at_top_right,rgba(93,127,150,0.28)_0%,transparent_45%),linear-gradient(165deg,#fbf7f2_0%,#f0e6da_38%,#e4eef3_72%,#d9e4ec_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,rgba(212,175,55,0.12)_0%,transparent_100%)]" />

      <div className="relative z-10 mx-auto max-w-6xl px-3 pb-10 pt-6 sm:px-4 sm:pt-8">
        <header className="mb-5 text-center">
          <p className="g-fade text-[10px] uppercase tracking-[0.32em] text-serene-deep">
            {coupleNames}
          </p>
          <h1 className="g-rise mt-1 font-display text-3xl text-terra-deep sm:text-4xl">
            Presentes
          </h1>
          <div className="g-fade invite-gold-line mt-3" />
          {guestName ? (
            <div className="g-fade mt-3">
              <p className="text-xs text-serene-deep">
                Presenteando como <strong>{guestName}</strong>
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Contribua o valor que puder.
              </p>
            </div>
          ) : (
            <p className="g-fade mt-3 text-[11px] text-muted">
              Contribua o valor que puder.
            </p>
          )}
        </header>

        {priority.length > 0 && tab === "all" ? (
          <section className="g-rise mb-5 overflow-hidden rounded-[1.4rem] border border-red-400/35 bg-gradient-to-br from-red-50/90 via-white/70 to-serene/10 px-4 py-4 shadow-[0_10px_30px_rgba(220,38,38,0.08)]">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-md">
                <span className="flame-icon-lg" aria-hidden>
                  <Flame size={18} />
                </span>
              </span>
              <div className="min-w-0 text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">
                  Prioridade da casa
                </p>
                <h2 className="font-display text-xl leading-tight text-terra-deep sm:text-2xl">
                  Ajude no essencial
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-muted sm:text-xs">
                  Itens em destaque. A lista muda conforme a necessidade do
                  momento.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {catalog.length === 0 && !openDonation ? (
          <p className="g-fade text-center text-muted">
            Em breve a lista estará disponível.
          </p>
        ) : (
          <>
            <nav
              className="sticky top-0 z-20 -mx-3 mb-4 border-b border-[rgba(212,175,55,0.25)] bg-[rgba(251,247,242,0.86)] px-3 py-2 backdrop-blur-md sm:-mx-4 sm:px-4"
              aria-label="Categorias de presentes"
            >
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {tabs.map((item) => {
                  const active = tab === item.id;
                  const urgentTab = item.id === "priority";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={cn(
                        "g-tab inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                        active &&
                          urgentTab &&
                          "border-red-500 bg-gradient-to-r from-red-600 to-red-500 text-white shadow-sm",
                        active &&
                          !urgentTab &&
                          "border-[rgba(212,175,55,0.65)] bg-gradient-to-r from-terra to-terra-deep text-white shadow-sm",
                        !active &&
                          urgentTab &&
                          "border-red-300/70 bg-red-50 text-red-700",
                        !active &&
                          !urgentTab &&
                          "border-black/10 bg-white/70 text-ink hover:border-[rgba(212,175,55,0.45)]",
                      )}
                    >
                      {urgentTab ? (
                        <span className="flame-icon" aria-hidden>
                          <Flame size={12} />
                        </span>
                      ) : null}
                      {item.label}
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px]",
                          active ? "bg-white/20" : "bg-black/5",
                        )}
                      >
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {visible.map((gift) => (
                <GiftCard key={gift.id} gift={gift} onSelect={setSelected} />
              ))}
            </div>

            {visible.length === 0 ? (
              <p className="g-fade mt-8 text-center text-sm text-muted">
                Nenhum presente nesta categoria.
              </p>
            ) : null}
          </>
        )}
      </div>

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
