"use client";

import { markInvitationSentAction } from "@/actions/guests";
import { Button } from "@/components/ui/button";
import { formatCurrency, whatsappShareUrl } from "@/lib/utils";
import type { GiftContribution, Guest } from "@/lib/types";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  guests: Guest[];
  contributions: GiftContribution[];
  appUrl: string;
};

export function InvitesManager({ guests, contributions, appUrl }: Props) {
  const [pending, startTransition] = useTransition();

  const raisedByGuest = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of contributions) {
      if (!c.guest_id) continue;
      map.set(c.guest_id, (map.get(c.guest_id) || 0) + Number(c.amount));
    }
    return map;
  }, [contributions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-terra-deep">Convites</h1>
        <p className="text-muted">Links personalizados e compartilhamento</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white/70">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/5 text-muted">
            <tr>
              <th className="px-4 py-3">Convidado</th>
              <th className="px-4 py-3">Convite</th>
              <th className="px-4 py-3">Acesso</th>
              <th className="px-4 py-3">Confirmação</th>
              <th className="px-4 py-3">Presente</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {guests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Cadastre convidados para gerar convites.
                </td>
              </tr>
            ) : (
              guests.map((guest) => {
                const link = `${appUrl}/casamento/${guest.slug}`;
                const message = `Olá, ${guest.name}! Você está convidado(a) para o nosso casamento. Acesse seu convite: ${link}`;
                const raised = raisedByGuest.get(guest.id) || 0;

                return (
                  <tr key={guest.id} className="border-b border-black/5">
                    <td className="px-4 py-3 font-medium">{guest.name}</td>
                    <td className="px-4 py-3">
                      {guest.invitation_status === "sent" ? "Enviado" : "Não enviado"}
                    </td>
                    <td className="px-4 py-3">
                      {guest.first_accessed_at ? "Visualizado" : "Não acessou"}
                    </td>
                    <td className="px-4 py-3">
                      {guest.confirmation_status === "confirmed"
                        ? "Confirmado"
                        : guest.confirmation_status === "declined"
                          ? "Recusou"
                          : "Pendente"}
                    </td>
                    <td className="px-4 py-3">{formatCurrency(raised)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          type="button"
                          onClick={() => window.open(link, "_blank")}
                        >
                          Abrir
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard.writeText(link);
                            toast.success("Link copiado");
                          }}
                        >
                          Copiar
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            startTransition(async () => {
                              window.open(
                                whatsappShareUrl(guest.phone, message),
                                "_blank",
                              );
                              await markInvitationSentAction(guest.id);
                              toast.success("Marcado como enviado");
                            });
                          }}
                        >
                          WhatsApp
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
