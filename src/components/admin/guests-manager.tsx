"use client";

import {
  createGuestAction,
  createGuestsBulkAction,
  deleteGuestAction,
  updateGuestAction,
} from "@/actions/guests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  GUEST_CATEGORIES,
  SEAT_PRICE,
  guestPartySize,
  summarizeGuestFinance,
} from "@/lib/guest-finance";
import { cn, formatCurrency } from "@/lib/utils";
import type { Guest } from "@/lib/types";
import Papa from "papaparse";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type TabId =
  | "all"
  | "free"
  | "paying"
  | "rsvp_pending"
  | "confirmed"
  | "declined"
  | "invite_pending"
  | "invite_sent"
  | "viewed"
  | string;

function confirmationLabel(status: Guest["confirmation_status"]) {
  if (status === "confirmed") return "Confirmado";
  if (status === "declined") return "Recusou";
  return "Pendente";
}

export function GuestsManager({
  guests,
  appUrl,
}: {
  guests: Guest[];
  appUrl: string;
}) {
  const baseUrl = appUrl.replace(/\/$/, "") || "https://rafael-adrielly-ivory.vercel.app";
  const [pending, startTransition] = useTransition();
  const [bulk, setBulk] = useState("");
  const [bulkCategory, setBulkCategory] = useState<string>(GUEST_CATEGORIES[0]);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("all");

  const finance = useMemo(() => summarizeGuestFinance(guests), [guests]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return guests.filter((g) => {
      const matchQuery =
        !q ||
        g.name.toLowerCase().includes(q) ||
        (g.category || "").toLowerCase().includes(q);
      if (!matchQuery) return false;
      if (tab === "all") return true;
      if (tab === "free") return !g.is_paying;
      if (tab === "paying") return g.is_paying;
      if (tab === "rsvp_pending") return g.confirmation_status === "pending";
      if (tab === "confirmed") return g.confirmation_status === "confirmed";
      if (tab === "declined") return g.confirmation_status === "declined";
      if (tab === "invite_pending") return g.invitation_status === "not_sent";
      if (tab === "invite_sent") {
        return g.invitation_status === "sent" && !g.first_accessed_at;
      }
      if (tab === "viewed") return Boolean(g.first_accessed_at);
      return g.category === tab;
    });
  }, [guests, query, tab]);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "all", label: "Todos", count: guests.length },
    { id: "paying", label: "Pagantes", count: guests.filter((g) => g.is_paying).length },
    { id: "free", label: "Não pagam", count: guests.filter((g) => !g.is_paying).length },
    {
      id: "rsvp_pending",
      label: "RSVP pendente",
      count: guests.filter((g) => g.confirmation_status === "pending").length,
    },
    {
      id: "confirmed",
      label: "Confirmados",
      count: guests.filter((g) => g.confirmation_status === "confirmed").length,
    },
    {
      id: "declined",
      label: "Recusaram",
      count: guests.filter((g) => g.confirmation_status === "declined").length,
    },
    {
      id: "invite_pending",
      label: "Convite pendente",
      count: guests.filter((g) => g.invitation_status === "not_sent").length,
    },
    {
      id: "invite_sent",
      label: "Enviados",
      count: guests.filter(
        (g) => g.invitation_status === "sent" && !g.first_accessed_at,
      ).length,
    },
    {
      id: "viewed",
      label: "Viram o convite",
      count: guests.filter((g) => Boolean(g.first_accessed_at)).length,
    },
    ...GUEST_CATEGORIES.map((category) => ({
      id: category,
      label: category,
      count: guests.filter((g) => g.category === category).length,
    })),
  ];

  function handleImportFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv" || ext === "txt") {
      Papa.parse(file, {
        complete: (result) => {
          const names = result.data
            .flat()
            .map((cell) => String(cell || "").trim())
            .filter((name) => name && name.toLowerCase() !== "nome");
          setBulk(names.join("\n"));
          toast.success(`${names.length} nomes carregados`);
        },
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const data = new Uint8Array(reader.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
        header: 1,
      });
      const names = rows
        .flat()
        .map((cell) => String(cell || "").trim())
        .filter((name) => name && name.toLowerCase() !== "nome");
      setBulk(names.join("\n"));
      toast.success(`${names.length} nomes carregados`);
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl text-terra-deep">Convidados</h1>
        <p className="text-muted">
          Categorias, preço por pessoa ({formatCurrency(SEAT_PRICE)}) e controle de
          pagamento
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total na festa"
          value={String(finance.totalPeople)}
          hint={`${finance.inviteCount} convites · ${finance.listNonPaying} não pagam · ${finance.venueCourtesy} cortesia`}
        />
        <SummaryCard
          label="Você paga"
          value={String(finance.payingPeople)}
          hint={`${finance.totalPeople} − ${finance.listNonPaying} − ${finance.venueCourtesy} cortesia`}
        />
        <SummaryCard
          label="Valor a pagar"
          value={formatCurrency(finance.payableAmount)}
          hint={`${finance.payingPeople} × ${formatCurrency(SEAT_PRICE)}`}
        />
        <SummaryCard
          label="Falta pagar"
          value={formatCurrency(finance.remainingAmount)}
          hint={`Já pago ${formatCurrency(finance.alreadyPaid)}`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white/70">
          <div className="border-b border-black/5 px-4 py-3">
            <h2 className="font-display text-2xl text-terra-deep">
              Parcelas (ago–dez)
            </h2>
            <p className="text-xs text-muted">
              Dividindo {formatCurrency(finance.remainingAmount)} em{" "}
              {finance.installmentCount} meses
            </p>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/5 text-muted">
              <tr>
                <th className="px-4 py-3">Mês</th>
                <th className="px-4 py-3">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {finance.paymentMonths.map((month) => (
                <tr key={month.label} className="border-b border-black/5">
                  <td className="px-4 py-3">{month.label}</td>
                  <td className="px-4 py-3 font-medium">
                    {formatCurrency(month.amount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-sand/60 font-semibold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3">
                  {formatCurrency(finance.remainingAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
          <h2 className="font-display text-2xl text-terra-deep">Resumo</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink">
            <li>
              Total na lista: {finance.totalPeople} pessoas
            </li>
            <li>
              Não pagantes: {finance.listNonPaying} · Cortesia do salão:{" "}
              {finance.venueCourtesy} (fixa)
            </li>
            <li>
              Você paga: {finance.payingPeople} pessoas (
              {finance.totalPeople} − {finance.listNonPaying} −{" "}
              {finance.venueCourtesy})
            </li>
            <li>Total da festa: {formatCurrency(finance.payableAmount)}</li>
            <li>Já pago: {formatCurrency(finance.alreadyPaid)}</li>
            <li className="font-semibold text-red-700">
              Falta pagar: {formatCurrency(finance.remainingAmount)}
            </li>
            <li>
              {finance.installmentCount} meses: agosto a dezembro
            </li>
            <li>Por mês: {formatCurrency(finance.installmentAmount)}</li>
          </ul>
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-black/5 bg-white/70">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/5 text-muted">
            <tr>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Convites</th>
              <th className="px-4 py-3">Pessoas</th>
              <th className="px-4 py-3">Pagantes</th>
              <th className="px-4 py-3">Não pagam</th>
              <th className="px-4 py-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {finance.byCategory.map((row) => (
              <tr key={row.category} className="border-b border-black/5">
                <td className="px-4 py-3 font-medium">{row.category}</td>
                <td className="px-4 py-3">{row.invites}</td>
                <td className="px-4 py-3">{row.total}</td>
                <td className="px-4 py-3">{row.paying}</td>
                <td className="px-4 py-3">{row.free}</td>
                <td className="px-4 py-3">{formatCurrency(row.amount)}</td>
              </tr>
            ))}
            <tr className="bg-sand/60 font-semibold">
              <td className="px-4 py-3">TOTAL</td>
              <td className="px-4 py-3">{finance.inviteCount}</td>
              <td className="px-4 py-3">{finance.totalPeople}</td>
              <td className="px-4 py-3">{finance.listPaying}</td>
              <td className="px-4 py-3">{finance.listNonPaying}</td>
              <td className="px-4 py-3">
                {formatCurrency(finance.listPaying * SEAT_PRICE)}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="space-y-1 border-t border-black/5 px-4 py-3 text-xs text-muted">
          <p>
            Não pagantes na lista: {finance.listNonPaying} ×{" "}
            {formatCurrency(SEAT_PRICE)} = {formatCurrency(finance.listFreeAmount)}
          </p>
          <p>
            Cortesia do salão (fixa): {finance.venueCourtesy} ×{" "}
            {formatCurrency(SEAT_PRICE)} = {formatCurrency(finance.courtesyAmount)}
          </p>
          <p>
            {finance.totalPeople} − {finance.listNonPaying} − {finance.venueCourtesy}{" "}
            = {finance.payingPeople} pessoas que você paga
          </p>
          <p className="font-semibold text-terra-deep">
            Final a pagar: {finance.payingPeople} × {formatCurrency(SEAT_PRICE)} ={" "}
            {formatCurrency(finance.payableAmount)}
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-3 rounded-2xl border border-black/5 bg-white/60 p-4"
          action={(fd) => {
            startTransition(async () => {
              const result = editing
                ? await updateGuestAction(fd)
                : await createGuestAction(fd);
              if (result.error) toast.error(result.error);
              else {
                toast.success(editing ? "Convidado atualizado" : "Convidado criado");
                setEditing(null);
              }
            });
          }}
        >
          <h2 className="font-display text-2xl">
            {editing ? "Editar convidado" : "Novo convidado"}
          </h2>
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <div>
            <Label>Nome</Label>
            <Input name="name" required defaultValue={editing?.name || ""} key={editing?.id || "new"} />
          </div>
          <div>
            <Label>Categoria</Label>
            <select
              name="category"
              defaultValue={editing?.category || GUEST_CATEGORIES[0]}
              key={`cat-${editing?.id || "new"}`}
              className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm"
            >
              {GUEST_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Preço (R$)</Label>
              <Input
                name="seat_price"
                type="number"
                min={0}
                step="0.01"
                defaultValue={editing?.seat_price ?? SEAT_PRICE}
                key={`price-${editing?.id || "new"}`}
              />
            </div>
            <div>
              <Label>Pagamento</Label>
              <select
                name="is_paying"
                defaultValue={editing ? String(editing.is_paying) : "true"}
                key={`pay-${editing?.id || "new"}`}
                className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm"
              >
                <option value="true">Paga</option>
                <option value="false">Não paga</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Nº de pessoas neste convite</Label>
            <Input
              name="party_size"
              type="number"
              min={1}
              max={50}
              step={1}
              defaultValue={editing?.party_size ?? 1}
              key={`party-${editing?.id || "new"}`}
            />
            <p className="mt-1 text-[11px] text-muted">
              Convite agrupado continua 1 link; a contagem financeira usa este
              número.
            </p>
          </div>
          <div>
            <Label>Telefone</Label>
            <Input name="phone" defaultValue={editing?.phone || ""} key={`phone-${editing?.id || "new"}`} />
          </div>
          <div>
            <Label>E-mail (opcional)</Label>
            <Input
              name="email"
              type="email"
              defaultValue={editing?.email || ""}
              key={`email-${editing?.id || "new"}`}
            />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea
              name="notes"
              defaultValue={editing?.notes || ""}
              rows={3}
              key={`notes-${editing?.id || "new"}`}
            />
          </div>
          {editing ? (
            <div>
              <Label>Status do convite</Label>
              <select
                name="invitation_status"
                defaultValue={editing.invitation_status}
                className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm"
              >
                <option value="not_sent">Não enviado</option>
                <option value="sent">Enviado</option>
              </select>
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {editing ? "Salvar" : "Adicionar"}
            </Button>
            {editing ? (
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>

        <div className="space-y-3 rounded-2xl border border-black/5 bg-white/60 p-4">
          <h2 className="font-display text-2xl">Adicionar vários</h2>
          <div>
            <Label>Categoria do lote</Label>
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm"
            >
              {GUEST_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <Textarea
            rows={8}
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={"João da Silva\nMaria da Silva\nPedro Oliveira"}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await createGuestsBulkAction(
                    bulk.split("\n"),
                    bulkCategory,
                  );
                  if (result.error) toast.error(result.error);
                  else {
                    toast.success(`${result.count} convidados criados`);
                    setBulk("");
                  }
                });
              }}
            >
              Criar em lote
            </Button>
            <label className="btn-secondary inline-flex cursor-pointer items-center rounded-xl px-4 py-2.5 text-sm">
              Importar CSV/Excel
              <input
                type="file"
                accept=".csv,.txt,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportFile(file);
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <nav className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  active
                    ? "border-[rgba(212,175,55,0.65)] bg-gradient-to-r from-terra to-terra-deep text-white"
                    : "border-black/10 bg-white/70 text-ink",
                )}
              >
                {item.label}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", active ? "bg-white/20" : "bg-black/5")}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </nav>

        <Input
          placeholder="Buscar convidado..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white/70">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/5 text-muted">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Pessoas</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Paga?</th>
                <th className="px-4 py-3">Confirmação</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    Nenhum convidado nesta aba.
                  </td>
                </tr>
              ) : (
                filtered.map((guest) => {
                  const link = `${baseUrl}/casamento/${guest.slug}`;
                  const people = guestPartySize(guest);
                  return (
                  <tr key={guest.id} className="border-b border-black/5">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span>{guest.name}</span>
                        {!guest.is_paying ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-700">
                            Não paga
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">{guest.category || "..."}</td>
                    <td className="px-4 py-3">
                      {people}
                      {people > 1 ? (
                        <span className="ml-1 text-[10px] text-muted">agrupado</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(Number(guest.seat_price || SEAT_PRICE))}
                    </td>
                    <td className="px-4 py-3">
                      {guest.is_paying ? (
                        <span className="text-serene-deep">Sim</span>
                      ) : (
                        <span className="font-semibold text-red-600">Não</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {confirmationLabel(guest.confirmation_status)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-xs font-semibold text-serene-deep underline underline-offset-2"
                        onClick={async () => {
                          await navigator.clipboard.writeText(link);
                          toast.success("Link do convite copiado");
                        }}
                      >
                        Copiar
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
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
                          onClick={() => {
                            if (!confirm("Excluir convidado?")) return;
                            startTransition(async () => {
                              const result = await deleteGuestAction(guest.id);
                              if (result.error) toast.error(result.error);
                              else toast.success("Convidado excluído");
                            });
                          }}
                        >
                          Excluir
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
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[rgba(212,175,55,0.28)] bg-white/70 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl text-terra-deep">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
