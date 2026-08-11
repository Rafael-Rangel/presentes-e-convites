"use client";

import { Countdown } from "@/components/invite/countdown";
import { InfinitePhotoCarousel } from "@/components/invite/infinite-photo-carousel";
import { RsvpForm } from "@/components/invite/rsvp-form";
import { Button } from "@/components/ui/button";
import {
  HERO_PHOTO,
  STORY_ROW_A,
  STORY_ROW_B,
  toWebpPath,
} from "@/lib/wedding-media";
import type { Guest, Wedding } from "@/lib/types";
import { useGSAP } from "@gsap/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Gift } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Props = {
  guest: Guest;
  wedding: Wedding;
};

export function InviteExperience({ guest, wedding }: Props) {
  const root = useRef<HTMLElement>(null);
  const settings = wedding.settings || {};
  const couple = settings.couple_names || "Rafael & Adrielly";
  const hero = toWebpPath(settings.hero_image || HERO_PHOTO);
  const rowA = STORY_ROW_A.slice(0, 8);
  const rowB = STORY_ROW_B.slice(0, 8);
  const dateLabel = wedding.date
    ? format(new Date(`${wedding.date}T12:00:00`), "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      })
    : "Data a confirmar";

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set(".a-hero, .a-detail", { clearProps: "all", opacity: 1 });
        return;
      }

      gsap.set(".a-hero", { opacity: 0, y: 28 });
      gsap.set(".invite-hero-media", { scale: 1.22, opacity: 0.55 });
      gsap.set(".invite-veil", { opacity: 0 });
      gsap.set(".a-detail", { opacity: 0, y: 36 });

      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

      intro
        .to(".invite-hero-media", {
          scale: 1,
          opacity: 1,
          duration: 2.2,
          ease: "power2.out",
        })
        .to(".invite-veil", { opacity: 1, duration: 1.1 }, 0.15)
        .to(
          ".a-hero",
          {
            opacity: 1,
            y: 0,
            duration: 0.95,
            stagger: 0.1,
            ease: "power3.out",
          },
          0.4,
        )
        .from(
          ".a-carousel",
          { opacity: 0, y: 24, duration: 0.9, stagger: 0.12 },
          0.95,
        );

      const details = gsap.timeline({
        scrollTrigger: {
          trigger: ".invite-details",
          start: "top 78%",
        },
        defaults: { ease: "power3.out" },
      });

      details
        .to(".a-detail", {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.09,
        })
        .from(
          ".a-detail-card > *",
          { opacity: 0, y: 16, duration: 0.55, stagger: 0.06 },
          "-=0.35",
        )
        .from(
          ".a-rsvp > *",
          { opacity: 0, y: 18, duration: 0.55, stagger: 0.05 },
          "-=0.2",
        );

      // anime.js complementa micro-entradas do formulário
      import("animejs").then((mod) => {
        const anime = mod.default;
        ScrollTrigger.create({
          trigger: ".invite-details",
          start: "top 70%",
          once: true,
          onEnter: () => {
            anime({
              targets: ".a-rsvp label, .a-rsvp button, .a-rsvp input, .a-rsvp textarea",
              translateY: [14, 0],
              opacity: [0, 1],
              duration: 650,
              easing: "easeOutCubic",
              delay: anime.stagger(45),
            });
          },
        });
      });
    },
    { scope: root },
  );

  return (
    <main ref={root} className="invite-root bg-[#f4ebe3] text-ink">
      {/* SEÇÃO 1 — Abertura */}
      <section className="invite-hero relative flex min-h-[100svh] flex-col overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero}
            alt={couple}
            className="invite-hero-media h-full w-full object-cover"
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div className="invite-veil absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#2a2420]" />

        <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-end px-5 pb-6 pt-16 text-center text-white">
          <p className="a-hero text-[11px] uppercase tracking-[0.42em] text-white/75">
            O convite de
          </p>
          <h1 className="a-hero mt-3 font-display text-[3.1rem] leading-[0.95] sm:text-6xl">
            {couple}
          </h1>
          <p className="a-hero mt-3 text-sm text-white/85">{dateLabel}</p>
          <p className="a-hero mt-5 text-[15px] leading-relaxed text-white/90">
            Olá, <span className="font-semibold">{guest.name}</span>.
            <br />
            {settings.welcome_message ||
              "Você está convidado para celebrar conosco."}
          </p>
          <div className="a-hero mt-6 w-full max-w-sm">
            <Countdown date={wedding.date} />
          </div>
          <div className="a-hero a-hero-btns mt-7 flex w-full flex-col gap-3">
            <a href="#confirmar" className="w-full">
              <Button size="lg" className="btn-press w-full">
                Confirmar presença
              </Button>
            </a>
            <Link href={`/presentes?guest=${guest.slug}`} className="w-full">
              <Button size="lg" variant="secondary" className="btn-press w-full">
                <Gift size={18} />
                Lista de presentes
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative z-10 space-y-2 pb-5 pt-4">
          <div className="a-carousel">
            <InfinitePhotoCarousel photos={[...rowA]} direction="left" />
          </div>
          <div className="a-carousel">
            <InfinitePhotoCarousel photos={[...rowB]} direction="right" />
          </div>
        </div>
      </section>

      {/* SEÇÃO 2 — Detalhes + RSVP */}
      <section
        id="confirmar"
        className="invite-details mx-auto max-w-md px-5 py-12 text-center"
      >
        <p className="a-detail text-[11px] uppercase tracking-[0.35em] text-terra">
          Nossa história
        </p>
        <h2 className="a-detail mt-3 font-display text-4xl text-terra-deep">
          {couple}
        </h2>
        <p className="a-detail mt-4 text-[15px] leading-relaxed text-muted">
          {settings.story ||
            "Do pedido ao sim, cada instante ganhou mais luz. Celebre conosco."}
        </p>

        <div className="a-detail a-detail-card mt-8 space-y-3 rounded-3xl bg-white/85 px-5 py-5 text-[14px] shadow-sm">
          <p>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-muted">
              Data
            </span>
            {dateLabel}
          </p>
          {settings.ceremony_time ? (
            <p>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-muted">
                Cerimônia
              </span>
              {settings.ceremony_time}
              {settings.reception_time ? ` · Recepção ${settings.reception_time}` : ""}
            </p>
          ) : null}
          {wedding.location ? (
            <p>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-muted">
                Local
              </span>
              {wedding.location}
            </p>
          ) : null}
          {settings.dress_code ? (
            <p>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-muted">
                Dress code
              </span>
              {settings.dress_code}
            </p>
          ) : null}
        </div>

        <h3 className="a-detail mt-10 font-display text-3xl text-terra-deep">
          Confirmar presença
        </h3>
        <p className="a-detail mt-2 text-sm text-muted">
          Sua resposta atualiza o painel em tempo real.
        </p>
        <div className="a-detail a-rsvp mt-5 text-left">
          <RsvpForm guest={guest} />
        </div>

        <div className="a-detail mt-8">
          <Link href={`/presentes?guest=${guest.slug}`} className="block w-full">
            <Button size="lg" variant="secondary" className="btn-press w-full">
              <Gift size={18} />
              Presentear
            </Button>
          </Link>
          <p className="mt-6 font-display text-xl text-terra-deep">{couple}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted">
            Com amor
          </p>
        </div>
      </section>
    </main>
  );
}
