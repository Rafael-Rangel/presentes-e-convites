"use client";

import {
  createGuestAction,
  deleteGuestAction,
  markInvitationSentAction,
  updateGuestAction,
} from "@/actions/guests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  GUEST_CATEGORIES,
  INVITE_GROUPS,
  SEAT_PRICE,
  guestMatchesInviteGroup,
  guestPartySize,
  inviteCategoryLabel,
  type InviteGroupId,
} from "@/lib/guest-finance";
import { createGuestSlug } from "@/lib/slug";
import { cn, formatCurrency, whatsappShareUrl } from "@/lib/utils";
import type { GiftContribution, Guest } from "@/lib/types";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

type StatusFilterId =
  | "all"
  | "rsvp_pending"
  | "confirmed"
  | "declined"
  | "invite_pending"
  | "invite_sent"
  | "viewed"
  | "free";

type Props = {
  guests: Guest[];
  contributions: GiftContribution[];
  appUrl: string;
};

function statusLabel(guest: Guest) {
  if (guest.confirmation_status === "confirmed") return "Confirmado";
  if (guest.confirmation_status === "declined") return "Recusou";
  if (guest.first_accessed_at) return "Viu";
  if (guest.invitation_status === "sent") return "Enviado";
  return "Pendente";
}

function statusTone(guest: Guest) {
  if (guest.confirmation_status === "confirmed") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (guest.confirmation_status === "declined") {
    return "bg-red-100 text-red-700";
  }
  if (guest.first_accessed_at) return "bg-serene/20 text-serene-deep";
  if (guest.invitation_status === "sent") return "bg-amber-100 text-amber-800";
  return "bg-black/5 text-muted";
}

function matchesStatusFilter(guest: Guest, status: StatusFilterId) {
  if (status === "all") return true;
  if (status === "free") return !guest.is_paying;
  if (status === "rsvp_pending") return guest.confirmation_status === "pending";
  if (status === "confirmed") return guest.confirmation_status === "confirmed";
  if (status === "declined") return guest.confirmation_status === "declined";
  if (status === "invite_pending") return guest.invitation_status === "not_sent";
  if (status === "invite_sent") {
    return guest.invitation_status === "sent" && !guest.first_accessed_at;
  }
  if (status === "viewed") return Boolean(guest.first_accessed_at);
  return true;
}

function defaultCategory(tab: InviteGroupId) {
  const group = INVITE_GROUPS.find((item) => item.id === tab);
  if (group?.categories.length === 1) return group.categories[0];
  if (tab === "cerimonia") return "Padrinhos";
  return GUEST_CATEGORIES[0];
}

export function InvitesManager({ guests, contributions, appUrl }: Props) {
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<InviteGroupId>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterId>("all");
  const [editing, setEditing] = useState<Guest | "new" | null>(null);
  const baseUrl =
    appUrl.replace(/\/$/, "") || "https://rafael-adrielly-ivory.vercel.app";

  const raisedByGuest = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of contributions) {
      if (!c.guest_id) continue;
      map.set(c.guest_id, (map.get(c.guest_id) || 0) + Number(c.amount));
    }
    return map;
  }, [contributions]);

  const inGroup = useMemo(
    () => guests.filter((guest) => guestMatchesInviteGroup(guest, tab)),
    [guests, tab],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inGroup
      .filter((guest) => matchesStatusFilter(guest, statusFilter))
      .filter((guest) => {
        if (!q) return true;
        return (
          guest.name.toLowerCase().includes(q) ||
          inviteCategoryLabel(guest.category).toLowerCase().includes(q) ||
          guest.slug.toLowerCase().includes(q) ||
          (guest.phone || "").includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [inGroup, query, statusFilter]);

  const grouped = useMemo(() => {
    const order = [
      "Convidados Adrielly",
      "Convidados Rafael",
      "Demoiselles",
      "Padrinhos",
      "Crianças de cerimônia",
      "Pais",
      "Avós",
      "Amigos dos noivos",
      "Crianças",
      "Banda",
    ];
    const map = new Map<string, Guest[]>();
    for (const guest of filtered) {
      const key = guest.category || "Outros";
      const list = map.get(key) || [];
      list.push(guest);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => {
      const ia = order.indexOf(a[0]);
      const ib = order.indexOf(b[0]);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [filtered]);

  const tabs = [
    { id: "all" as const, label: "Todos", count: guests.length },
    ...INVITE_GROUPS.map((group) => ({
      id: group.id,
      label: group.label,
      count: guests.filter((guest) => guestMatchesInviteGroup(guest, group.id))
        .length,
    })),
  ].filter((item) => item.id === "all" || item.count > 0);

  const statusTabs: { id: StatusFilterId; label: string; count: number }[] = [
    { id: "all", label: "Todos status", count: inGroup.length },
    {
      id: "free",
      label: "Não pagam",
      count: inGroup.filter((g) => !g.is_paying).length,
    },
    {
      id: "rsvp_pending",
      label: "RSVP pendente",
      count: inGroup.filter((g) => g.confirmation_status === "pending").length,
    },
    {
      id: "confirmed",
      label: "Confirmados",
      count: inGroup.filter((g) => g.confirmation_status === "confirmed").length,
    },
    {
      id: "declined",
      label: "Recusaram",
      count: inGroup.filter((g) => g.confirmation_status === "declined").length,
    },
    {
      id: "invite_pending",
      label: "Convite pendente",
      count: inGroup.filter((g) => g.invitation_status === "not_sent").length,
    },
    {
      id: "invite_sent",
      label: "Enviados",
      count: inGroup.filter(
        (g) => g.invitation_status === "sent" && !g.first_accessed_at,
      ).length,
    },
    {
      id: "viewed",
      label: "Viram",
      count: inGroup.filter((g) => Boolean(g.first_accessed_at)).length,
    },
  ];

  function inviteLink(guest: Guest) {
    return `${baseUrl}/casamento/${guest.slug}`;
  }

  function shareMessage(guest: Guest) {
    return `Olá, ${guest.name}! Você está convidado(a) para o nosso casamento. Acesse seu convite: ${inviteLink(guest)}`;
  }

  function copyLink(guest: Guest) {
    void navigator.clipboard.writeText(inviteLink(guest));
    toast.success("Link copiado");
  }

  function sendWhatsApp(guest: Guest) {
    startTransition(async () => {
      window.open(whatsappShareUrl(guest.phone, shareMessage(guest)), "_blank");
      await markInvitationSentAction(guest.id);
      toast.success("Marcado como enviado");
    });
  }

  function removeGuest(guest: Guest) {
    if (
      !window.confirm(
        `Excluir o convite de ${guest.name}? O link /casamento/${guest.slug} deixa de funcionar.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteGuestAction(guest.id);
      if (result.error) toast.error(result.error);
      else toast.success("Convite excluído");
    });
  }

  const actionButtons = (guest: Guest) => (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="min-h-11 flex-1 text-xs"
        type="button"
        onClick={() => window.open(inviteLink(guest), "_blank")}
      >
        Abrir
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="min-h-11 flex-1 text-xs"
        type="button"
        onClick={() => copyLink(guest)}
      >
        Copiar
      </Button>
      <Button
        size="sm"
        variant="secondary"
        className="min-h-11 flex-1 text-xs"
        type="button"
        disabled={pending}
        onClick={() => sendWhatsApp(guest)}
      >
        Zap
      </Button>
    </>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-terra-deep sm:text-4xl">
            Convites
          </h1>
          <p className="text-sm text-muted">
            Crie, edite o nome (a URL muda junto) e envie
          </p>
        </div>
        <Button type="button" className="min-h-11 shrink-0" onClick={() => setEditing("new")}>
          Novo
        </Button>
      </div>

      <div className="sticky top-[3.75rem] z-20 -mx-3 space-y-3 bg-[rgba(251,247,242,0.94)] px-3 py-3 backdrop-blur-md md:top-0 sm:mx-0 sm:rounded-2xl sm:border sm:border-black/5 sm:bg-white/70 sm:px-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar nome, grupo, URL ou telefone"
          inputMode="search"
          className="h-11 text-base"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                  active
                    ? "bg-terra text-white"
                    : "bg-white/80 text-ink ring-1 ring-black/8",
                )}
              >
                {item.label} {item.count}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {statusTabs.map((item) => {
            const active = statusFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                  active
                    ? item.id === "free"
                      ? "bg-red-600 text-white"
                      : "bg-serene-deep text-white"
                    : item.id === "free"
                      ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                      : "bg-white/80 text-ink ring-1 ring-black/8",
                )}
              >
                {item.label} {item.count}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted">{filtered.length} convites</p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-white/70 px-4 py-8 text-center text-sm text-muted">
          Nenhum convite neste filtro.
        </p>
      ) : (
        <div className="space-y-5">
          {grouped.map(([category, rows]) => (
            <section key={category} className="space-y-2">
              <div className="flex items-baseline justify-between px-1">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-serene-deep">
                  {inviteCategoryLabel(category)}
                </h2>
                <span className="text-[11px] text-muted">{rows.length}</span>
              </div>

              <div className="space-y-2 md:hidden">
                {rows.map((guest) => {
                  const raised = raisedByGuest.get(guest.id) || 0;
                  const people = guestPartySize(guest);
                  return (
                    <article
                      key={guest.id}
                      className="rounded-2xl border border-black/5 bg-white/80 p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">
                            {guest.name}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {!guest.is_paying ? (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-700">
                                Não paga
                              </span>
                            ) : null}
                            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-muted">
                              {people} {people === 1 ? "pessoa" : "pessoas"}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-muted">
                            /casamento/{guest.slug}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted">
                            {inviteCategoryLabel(guest.category)}
                            {raised > 0 ? ` · ${formatCurrency(raised)}` : ""}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            statusTone(guest),
                          )}
                        >
                          {statusLabel(guest)}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-1.5">
                        {actionButtons(guest)}
                      </div>
                      <div className="mt-1.5 flex gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="min-h-11 flex-1 text-xs"
                          type="button"
                          onClick={() => setEditing(guest)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="min-h-11 flex-1 text-xs"
                          type="button"
                          disabled={pending}
                          onClick={() => removeGuest(guest)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden overflow-hidden rounded-2xl border border-black/5 bg-white/70 md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-black/5 text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Convidado</th>
                      <th className="px-4 py-3 font-medium">URL</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Presente</th>
                      <th className="px-4 py-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((guest) => {
                      const raised = raisedByGuest.get(guest.id) || 0;
                      const people = guestPartySize(guest);
                      return (
                        <tr
                          key={guest.id}
                          className="border-b border-black/5 last:border-0"
                        >
                          <td className="px-4 py-3 font-medium">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span>{guest.name}</span>
                              {!guest.is_paying ? (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-700">
                                  Não paga
                                </span>
                              ) : null}
                              {people > 1 ? (
                                <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-muted">
                                  {people} pessoas
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="max-w-[180px] truncate px-4 py-3 text-xs text-muted">
                            /casamento/{guest.slug}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                statusTone(guest),
                              )}
                            >
                              {statusLabel(guest)}
                            </span>
                          </td>
                          <td className="px-4 py-3">{formatCurrency(raised)}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {actionButtons(guest)}
                              <Button
                                size="sm"
                                variant="ghost"
                                type="button"
                                onClick={() => setEditing(guest)}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                type="button"
                                disabled={pending}
                                onClick={() => removeGuest(guest)}
                              >
                                Excluir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {editing ? (
        <GuestEditor
          guest={editing === "new" ? null : editing}
          defaultCategory={defaultCategory(tab)}
          baseUrl={baseUrl}
          pending={pending}
          onClose={() => setEditing(null)}
          onSubmit={(formData) => {
            startTransition(async () => {
              const result =
                editing === "new"
                  ? await createGuestAction(formData)
                  : await updateGuestAction(formData);
              if (result.error) {
                toast.error(result.error);
                return;
              }
              const slug = "slug" in result ? result.slug : undefined;
              toast.success(
                editing === "new"
                  ? `Convite criado: /casamento/${slug}`
                  : `Convite atualizado: /casamento/${slug}`,
              );
              setEditing(null);
            });
          }}
        />
      ) : null}
    </div>
  );
}

function GuestEditor({
  guest,
  defaultCategory,
  baseUrl,
  pending,
  onClose,
  onSubmit,
}: {
  guest: Guest | null;
  defaultCategory: string;
  baseUrl: string;
  pending: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  const [name, setName] = useState(guest?.name || "");
  const [mounted, setMounted] = useState(false);
  const previewSlug = createGuestSlug(name) || "convidado";

  useEffect(() => {
    setMounted(true);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
      style={{ height: "100dvh" }}
      onClick={onClose}
    >
      <form
        className="flex max-h-[90dvh] w-full flex-col rounded-t-[1.6rem] bg-[#fbf7f2] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-md sm:rounded-[1.6rem]"
        onClick={(e) => e.stopPropagation()}
        action={onSubmit}
      >
        {guest ? <input type="hidden" name="id" value={guest.id} /> : null}
        <input
          type="hidden"
          name="seat_price"
          value={guest?.seat_price ?? SEAT_PRICE}
        />
        <input
          type="hidden"
          name="is_paying"
          value={guest ? String(guest.is_paying) : "true"}
        />
        {guest ? (
          <input
            type="hidden"
            name="invitation_status"
            value={guest.invitation_status}
          />
        ) : null}

        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-serene-deep">
              {guest ? "Editar convite" : "Novo convite"}
            </p>
            <h2 className="font-display text-2xl text-terra-deep">
              {guest ? guest.name : "Convidado"}
            </h2>
          </div>
          <Button type="button" className="min-h-11" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          <div>
            <Label>Nome no convite</Label>
            <Input
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className="h-11 text-base"
            />
          </div>

          <div>
            <Label>Nº de pessoas neste convite</Label>
            <Input
              name="party_size"
              type="number"
              min={1}
              max={50}
              step={1}
              defaultValue={guest?.party_size ?? 1}
              className="h-11 text-base"
            />
            <p className="mt-1 text-[11px] text-muted">
              Ex.: “Fulano e Ciclano” = 2. Continua 1 link; a conta usa este nº.
            </p>
          </div>

          <div className="rounded-xl bg-white/80 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              URL do convite
            </p>
            <p className="mt-1 break-all text-xs font-medium text-ink">
              {baseUrl}/casamento/{previewSlug}
            </p>
            {guest && guest.slug !== previewSlug ? (
              <p className="mt-1 text-[11px] text-terra-deep">
                O link antigo /casamento/{guest.slug} deixa de valer ao salvar.
              </p>
            ) : null}
          </div>

          <div>
            <Label>Grupo</Label>
            <select
              name="category"
              defaultValue={guest?.category || defaultCategory}
              className="h-11 w-full rounded-xl border border-black/10 bg-white/80 px-3 text-sm"
            >
              {GUEST_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {inviteCategoryLabel(category)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Telefone (WhatsApp)</Label>
            <Input
              name="phone"
              defaultValue={guest?.phone || ""}
              inputMode="tel"
              className="h-11 text-base"
            />
          </div>

          <div>
            <Label>E-mail (opcional)</Label>
            <Input
              name="email"
              type="email"
              defaultValue={guest?.email || ""}
            />
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea name="notes" defaultValue={guest?.notes || ""} rows={3} />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button type="submit" className="min-h-11 flex-1" disabled={pending}>
            {guest ? "Salvar e atualizar URL" : "Criar convite"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={onClose}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
