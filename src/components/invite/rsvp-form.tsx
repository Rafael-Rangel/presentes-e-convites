"use client";

import { submitRsvpAction } from "@/actions/rsvp";
import type { ConfirmationStatus, Guest } from "@/lib/types";
import { Check, RotateCcw, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function RsvpForm({ guest }: { guest: Guest }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<ConfirmationStatus>(
    guest.confirmation_status,
  );

  function send(next: "confirmed" | "declined") {
    const fd = new FormData();
    fd.set("slug", guest.slug);
    fd.set("confirmation_status", next);
    fd.set("companions_count", "0");
    fd.set("companions", "");

    startTransition(async () => {
      const result = await submitRsvpAction(fd);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setStatus(next);
      toast.success(
        next === "confirmed"
          ? "Presença confirmada. Obrigado!"
          : "Resposta registrada. Sentiremos sua falta.",
      );
    });
  }

  return (
    <div className="space-y-3">
      {status === "confirmed" ? (
        <div className="space-y-3">
          <p className="rounded-2xl border border-[rgba(212,175,55,0.35)] bg-white/20 px-4 py-3 text-center text-sm text-white/90 backdrop-blur-sm">
            Sua presença está confirmada
          </p>
          <div className="btn-aura btn-streak-4 rounded-[1.05rem]">
            <button
              type="button"
              disabled={pending}
              onClick={() => send("declined")}
              className="btn-rsvp-no btn-press btn-streak-4 w-full rounded-2xl px-4 py-3.5 text-sm font-semibold disabled:opacity-60"
            >
              <span className="btn-label">
                <X size={18} strokeWidth={2.5} aria-hidden />
                <span>{pending ? "Atualizando..." : "Desconfirmar presença"}</span>
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {status === "declined" ? (
        <div className="space-y-3">
          <p className="rounded-2xl border border-[rgba(212,175,55,0.35)] bg-white/20 px-4 py-3 text-center text-sm text-white/90 backdrop-blur-sm">
            Você marcou que não poderá ir
          </p>
          <div className="btn-aura btn-streak-5 rounded-[1.05rem]">
            <button
              type="button"
              disabled={pending}
              onClick={() => send("confirmed")}
              className="btn-rsvp-yes btn-press btn-streak-5 w-full rounded-2xl px-4 py-3.5 text-sm font-semibold disabled:opacity-60"
            >
              <span className="btn-label">
                <RotateCcw size={18} strokeWidth={2.5} aria-hidden />
                <span>{pending ? "Atualizando..." : "Confirmar presença"}</span>
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {status === "pending" ? (
        <>
          <div className="btn-aura btn-streak-1 rounded-[1.05rem]">
            <button
              type="button"
              disabled={pending}
              onClick={() => send("confirmed")}
              className="btn-rsvp-yes btn-press btn-streak-1 w-full rounded-2xl px-4 py-3.5 text-sm font-semibold disabled:opacity-60"
            >
              <span className="btn-label">
                <Check size={18} strokeWidth={2.5} aria-hidden />
                <span>{pending ? "Enviando..." : "Confirmar presença"}</span>
              </span>
            </button>
          </div>

          <div className="btn-aura btn-streak-3 rounded-[1.05rem]">
            <button
              type="button"
              disabled={pending}
              onClick={() => send("declined")}
              className="btn-rsvp-no btn-press btn-streak-3 w-full rounded-2xl px-4 py-3.5 text-sm font-semibold disabled:opacity-60"
            >
              <span className="btn-label">
                <X size={18} strokeWidth={2.5} aria-hidden />
                <span>{pending ? "Enviando..." : "Não poderei ir"}</span>
              </span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
