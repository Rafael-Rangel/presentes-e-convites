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
import { isCeremonyParticipant } from "@/lib/guest-finance";
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

function formatInviteClock(value?: string | null) {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (match) return `${Number(match[1])}h${match[2]}`;
  return value.trim();
}

type Props = {
  guest: Guest;
  wedding: Wedding;
};

export function InviteExperience({ guest, wedding }: Props) {
  const root = useRef<HTMLElement>(null);
  const settings = wedding.settings || {};
  const couple = settings.couple_names || "Rafael & Adrielly";
  const hero = toWebpPath(settings.hero_image || HERO_PHOTO);
  const storyBg = toWebpPath(
    settings.gallery?.[1] || settings.gallery?.[0] || STORY_ROW_B[2] || HERO_PHOTO,
  );
  const rowA = STORY_ROW_A;
  const rowB = STORY_ROW_B;
  const dateLabel = wedding.date
    ? format(new Date(`${wedding.date}T12:00:00`), "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      })
    : "Data a confirmar";
  const dateDay = wedding.date
    ? format(new Date(`${wedding.date}T12:00:00`), "d", { locale: ptBR })
    : null;
  const dateMonthYear = wedding.date
    ? format(new Date(`${wedding.date}T12:00:00`), "MMMM 'de' yyyy", {
        locale: ptBR,
      })
    : null;
  const weekdayLabel = wedding.date
    ? format(new Date(`${wedding.date}T12:00:00`), "EEEE", { locale: ptBR })
    : null;
  const ceremonyParticipant = isCeremonyParticipant(guest);
  const cortejoTime =
    formatInviteClock(settings.ceremony_time) || "18h15";
  const guestArrival =
    formatInviteClock(settings.arrival_time) || "17h45";
  const ceremonyArrival =
    formatInviteClock(settings.ceremony_arrival_time) || "17h15";
  const arrivalTime = ceremonyParticipant ? ceremonyArrival : guestArrival;
  const arrivalCaption = ceremonyParticipant
    ? "Chegada da cerimônia"
    : "Chegada dos convidados";
  const eventLabel = ceremonyParticipant ? "Cortejo" : "Cerimônia";
  const dressCode = settings.dress_code || "Esporte fino";
  const mapQuery = [wedding.location, settings.address]
    .filter(Boolean)
    .join(" ");

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set(
          ".a-hero, .a-detail, .a-fade, .a-rise, .a-count, .invite-carousel-bridge, .invite-details-media",
          { clearProps: "all", opacity: 1 },
        );
        return;
      }

      gsap.set(".a-hero", { opacity: 0, y: 26 });
      gsap.set(".a-count", { opacity: 0, y: 14, scale: 0.94 });
      gsap.set(".invite-hero-media", { scale: 1.22, opacity: 0.55 });
      gsap.set(".invite-details-media", { scale: 1.12, opacity: 0.55 });
      gsap.set(".invite-veil", { opacity: 0 });
      gsap.set(".a-detail", { opacity: 0, y: 32 });
      gsap.set(".a-fade", { opacity: 0 });
      gsap.set(".a-rise", { opacity: 0, y: 18 });
      gsap.set(".invite-carousel-bridge", { opacity: 0, y: 36 });

      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

      intro
        .to(".invite-hero-media", {
          scale: 1,
          opacity: 1,
          duration: 2.2,
          ease: "power2.out",
        })
        .to(".invite-veil", { opacity: 1, duration: 1.15 }, 0.12)
        .to(
          ".a-hero",
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.09,
            ease: "power3.out",
          },
          0.35,
        )
        .to(
          ".a-count",
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.55,
            stagger: 0.06,
            ease: "power2.out",
          },
          0.85,
        )
        .to(
          ".invite-carousel-bridge",
          { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
          1.05,
        );

      const details = gsap.timeline({
        scrollTrigger: {
          trigger: ".invite-details",
          start: "top 82%",
          once: true,
        },
        defaults: { ease: "power3.out" },
      });

      details
        .to(".invite-details-media", {
          scale: 1,
          opacity: 1,
          duration: 1.35,
          ease: "power2.out",
        })
        .to(
          ".a-detail",
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.08,
          },
          0.15,
        )
        .to(
          ".a-fade",
          {
            opacity: 1,
            duration: 0.85,
            stagger: 0.07,
          },
          0.28,
        )
        .to(
          ".a-rise",
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.05,
          },
          0.42,
        )
        .from(
          ".a-rsvp > *",
          { opacity: 0, y: 16, duration: 0.55, stagger: 0.05 },
          "-=0.25",
        );

      import("animejs").then((mod) => {
        const anime = mod.default;
        ScrollTrigger.create({
          trigger: ".invite-details",
          start: "top 72%",
          once: true,
          onEnter: () => {
            anime({
              targets:
                ".a-rsvp label, .a-rsvp button, .a-rsvp input, .a-rsvp textarea",
              translateY: [12, 0],
              opacity: [0, 1],
              duration: 620,
              easing: "easeOutCubic",
              delay: anime.stagger(40),
            });
          },
        });
      });
    },
    { scope: root },
  );

  return (
    <main ref={root} className="invite-root bg-[#f4ebe3] text-ink">
      {/* SEÇÃO 1: Abertura */}
      <section className="invite-hero relative z-20 flex min-h-[100svh] flex-col overflow-visible">
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero}
            alt={couple}
            className="invite-hero-media h-full w-full object-cover"
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div className="invite-veil absolute inset-0 bg-[linear-gradient(180deg,rgba(244,235,227,0.78)_0%,rgba(93,127,150,0.72)_40%,rgba(63,93,114,0.88)_100%)]" />
        <div className="invite-veil absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,247,242,0.55)_0%,transparent_50%),radial-gradient(ellipse_at_bottom,rgba(42,58,72,0.55)_0%,transparent_55%)]" />
        <div className="invite-veil absolute inset-0 bg-black/25" />

        <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-end px-5 pb-2 pt-16 text-center text-white">
          <p className="a-hero text-[11px] uppercase tracking-[0.42em] text-white/75">
            O convite de
          </p>
          <h1 className="a-hero mt-3 font-display text-[3.1rem] leading-[0.95] sm:text-6xl">
            {couple}
          </h1>
          <p className="a-hero mt-3 text-sm text-white/85">{dateLabel}</p>
          <p className="a-hero mt-5 font-display text-[2.1rem] leading-[1.05] text-white sm:text-4xl">
            Olá {guest.name}
          </p>
          <p className="a-hero mt-3 text-[15px] leading-relaxed text-white/90">
            {settings.welcome_message ||
              "Você está convidado para celebrar conosco."}
          </p>
          <div className="a-hero mt-6 w-full max-w-sm">
            <Countdown date={wedding.date} />
          </div>
          <div className="a-hero a-hero-btns mt-7 flex w-full flex-col gap-3">
            <div className="btn-aura btn-streak-1">
              <a href="#confirmar" className="w-full">
                <Button size="lg" className="btn-press btn-streak-1 w-full">
                  Confirmar presença
                </Button>
              </a>
            </div>
            <div className="btn-aura btn-streak-2">
              <Link href={`/presentes?guest=${guest.slug}`} className="w-full">
                <Button
                  size="lg"
                  variant="secondary"
                  className="btn-press btn-streak-2 w-full"
                >
                  <span className="btn-label">
                    <Gift size={18} aria-hidden />
                    <span>Lista de presentes</span>
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="invite-carousel-bridge relative z-30 mt-14 -mb-14 space-y-2.5 sm:mt-16 sm:-mb-16">
          <div className="a-carousel">
            <InfinitePhotoCarousel
              photos={[...rowA]}
              direction="left"
              staggerDelay={0.15}
            />
          </div>
          <div className="a-carousel">
            <InfinitePhotoCarousel
              photos={[...rowB]}
              direction="right"
              staggerDelay={0.55}
            />
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: História + detalhes + RSVP (mobile-first) */}
      <section
        id="confirmar"
        className="invite-details relative z-10 min-h-[100svh] overflow-hidden"
      >
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={storyBg}
            alt=""
            className="invite-details-media h-full w-full scale-110 object-cover opacity-70"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(244,235,227,0.94)_0%,rgba(244,235,227,0.86)_26%,rgba(93,127,150,0.78)_68%,rgba(63,93,114,0.92)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,247,242,0.6)_0%,transparent_48%)]" />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 mx-auto flex w-full max-w-[min(100%,24rem)] flex-col px-4 pb-14 pt-24 text-center sm:max-w-lg sm:px-5 sm:pt-28 md:max-w-xl md:px-6 lg:max-w-2xl">
          <div className="a-detail a-detail-card invite-detail-glass w-full rounded-[1.6rem] px-5 py-7 text-center sm:rounded-[1.85rem] sm:px-8 sm:py-9 md:px-10 md:py-10">
            <p className="a-fade invite-detail-label">Nossa história</p>
            <h2 className="a-rise mt-3 font-display text-[2.45rem] leading-[0.95] text-terra-deep sm:text-[3.1rem] md:text-[3.4rem]">
              Do pedido ao sim
            </h2>
            <div className="a-fade invite-gold-line mt-5" />
            <p className="a-rise mx-auto mt-5 max-w-[34rem] text-[15px] leading-relaxed text-ink/85 sm:text-base">
              {settings.story ||
                "Do pedido ao sim, cada instante ganhou mais luz. Celebre conosco."}
            </p>

            <div className="a-fade invite-detail-ornament my-7 sm:my-8" />

            <p className="a-fade invite-detail-label">Os detalhes</p>
            <div className="a-fade invite-detail-ornament mt-3" />

            <div className="a-rise mt-6">
              <p className="invite-detail-label">Data</p>
              {dateDay ? (
                <>
                  <p className="invite-detail-date-day mt-2">{dateDay}</p>
                  <p className="invite-detail-date-meta">{dateMonthYear}</p>
                  {weekdayLabel ? (
                    <p className="mt-1 text-[13px] font-medium capitalize tracking-[0.04em] text-muted">
                      {weekdayLabel}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="invite-detail-value mt-2 font-display text-2xl">
                  {dateLabel}
                </p>
              )}
            </div>

            <div className="a-fade invite-detail-ornament my-6" />

            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              <div className="a-rise rounded-2xl bg-[rgba(93,127,150,0.08)] px-3 py-4 sm:px-4">
                <p className="invite-detail-label">Chegada</p>
                <p className="mt-1 text-[10px] font-semibold leading-snug tracking-[0.04em] text-muted sm:text-[11px]">
                  {arrivalCaption}
                </p>
                <p className="invite-detail-time mt-2 text-serene-deep">
                  {arrivalTime}
                </p>
              </div>
              <div className="a-rise rounded-2xl bg-[rgba(184,92,56,0.06)] px-3 py-4 sm:px-4">
                <p className="invite-detail-label">{eventLabel}</p>
                <p className="mt-1 text-[10px] font-semibold leading-snug tracking-[0.04em] text-muted sm:text-[11px]">
                  Início do cortejo / entradas
                </p>
                <p className="invite-detail-time mt-2">{cortejoTime}</p>
              </div>
            </div>

            {ceremonyParticipant ? (
              <p className="a-fade mt-3 text-center text-[11px] leading-relaxed text-muted sm:text-xs">
                Você participa da cerimônia. Chegue às {ceremonyArrival} para
                se preparar com tranquilidade.
              </p>
            ) : null}

            <div className="a-rise mt-5 rounded-2xl border border-[rgba(212,175,55,0.35)] bg-white/55 px-4 py-4 sm:py-5">
              <p className="invite-detail-label">Dress code</p>
              <p className="mt-2 font-display text-[1.55rem] leading-tight text-terra-deep sm:text-[1.75rem]">
                {dressCode}
              </p>
            </div>

            {(wedding.location || settings.address) && (
              <div className="a-rise mt-6 text-left">
                <div className="invite-detail-ornament mb-5" />
                <p className="invite-detail-label text-center">Endereço</p>
                {wedding.location ? (
                  <p className="invite-detail-venue mt-3 text-center">
                    {wedding.location}
                  </p>
                ) : null}
                {settings.address ? (
                  <p className="mx-auto mt-2 max-w-xl text-center text-[14px] leading-relaxed text-ink/80 sm:text-[15px]">
                    {settings.address}
                  </p>
                ) : null}

                {mapQuery ? (
                  <div className="mt-5 overflow-hidden rounded-2xl border border-[rgba(212,175,55,0.35)] bg-white/70 shadow-[0_10px_24px_rgba(42,36,32,0.12)]">
                    <iframe
                      title="Mapa do local"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        mapQuery,
                      )}&z=15&output=embed`}
                      className="h-48 w-full border-0 sm:h-56 md:h-64"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                ) : null}

                {settings.map_url ? (
                  <a
                    href={settings.map_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block text-center text-[12px] font-semibold tracking-[0.08em] text-serene-deep underline underline-offset-4"
                  >
                    Abrir no Google Maps
                  </a>
                ) : null}
              </div>
            )}
          </div>

          <div className="a-detail mt-10">
            <h3 className="font-display text-3xl text-white">Confirmar presença</h3>
            <p className="mt-2 text-sm text-white/80">
              Sua resposta atualiza o painel em tempo real.
            </p>
          </div>

          <div className="a-detail a-rsvp mt-5">
            <RsvpForm guest={guest} />
          </div>

          <div className="a-detail mt-4">
            <div className="btn-aura btn-streak-3">
              <Link href={`/presentes?guest=${guest.slug}`} className="block w-full">
                <Button
                  size="lg"
                  variant="secondary"
                  className="btn-press btn-streak-3 w-full"
                >
                  <span className="btn-label">
                    <Gift size={18} aria-hidden />
                    <span>Presentear</span>
                  </span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="a-detail mt-10">
            <div className="invite-gold-line mb-4" />
            <p className="font-display text-2xl text-white">{couple}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.32em] text-white/70">
              Com amor
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
