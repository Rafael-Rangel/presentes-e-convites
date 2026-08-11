"use client";

import { submitRsvpAction } from "@/actions/rsvp";
import type { Guest } from "@/lib/types";
import { Check, X } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

export function RsvpForm({ guest }: { guest: Guest }) {
  const [pending, startTransition] = useTransition();
  const current = guest.confirmation_status;

  function send(status: "confirmed" | "declined") {
    const fd = new FormData();
    fd.set("slug", guest.slug);
    fd.set("confirmation_status", status);
    fd.set("companions_count", "0");
    fd.set("companions", "");

    startTransition(async () => {
      const result = await submitRsvpAction(fd);
      if (result.error) toast.error(result.error);
      else {
        toast.success(
          status === "confirmed"
            ? "Presença confirmada. Obrigado!"
            : "Resposta registrada. Sentiremos sua falta.",
        );
      }
    });
  }

  return (
    <div className="space-y-3 rounded-3xl bg-white/80 p-4 shadow-sm">
      <button
        type="button"
        disabled={pending}
        onClick={() => send("confirmed")}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60 ${
          current === "confirmed"
            ? "bg-emerald-500 text-white shadow-[0_6px_0_#059669]"
            : "bg-emerald-100 text-emerald-800 shadow-[0_5px_0_#a7f3d0] hover:bg-emerald-200"
        }`}
      >
        <Check size={18} strokeWidth={2.5} />
        {pending ? "Enviando..." : "Confirmar presença"}
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => send("declined")}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60 ${
          current === "declined"
            ? "bg-rose-400 text-white shadow-[0_6px_0_#e11d48]"
            : "bg-rose-100 text-rose-700 shadow-[0_5px_0_#fecdd3] hover:bg-rose-200"
        }`}
      >
        <X size={18} strokeWidth={2.5} />
        {pending ? "Enviando..." : "Não poderei ir"}
      </button>
    </div>
  );
}
