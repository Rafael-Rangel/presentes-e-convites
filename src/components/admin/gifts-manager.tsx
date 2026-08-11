"use client";

import {
  createGiftAction,
  deleteGiftAction,
  toggleGiftStatusAction,
  updateGiftAction,
} from "@/actions/gifts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import type { GiftWithProgress } from "@/lib/types";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function GiftsManager({ gifts }: { gifts: GiftWithProgress[] }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<GiftWithProgress | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl text-terra-deep">Presentes</h1>
        <p className="text-muted">Gerencie a lista e acompanhe contribuições</p>
      </div>

      <form
        className="grid gap-3 rounded-2xl border border-black/5 bg-white/60 p-4 md:grid-cols-2"
        action={(fd) => {
          startTransition(async () => {
            const result = editing
              ? await updateGiftAction(fd)
              : await createGiftAction(fd);
            if (result.error) toast.error(result.error);
            else {
              toast.success(editing ? "Presente atualizado" : "Presente criado");
              setEditing(null);
            }
          });
        }}
      >
        <h2 className="font-display text-2xl md:col-span-2">
          {editing ? "Editar presente" : "Novo presente"}
        </h2>
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
        <div>
          <Label>Nome</Label>
          <Input name="name" required defaultValue={editing?.name || ""} />
        </div>
        <div>
          <Label>Valor (R$)</Label>
          <Input
            name="price"
            type="number"
            step="0.01"
            min="1"
            required
            defaultValue={editing?.price || ""}
          />
        </div>
        <div>
          <Label>Categoria</Label>
          <Input name="category" defaultValue={editing?.category || ""} />
        </div>
        <div>
          <Label>Quantidade</Label>
          <Input
            name="quantity"
            type="number"
            min="1"
            defaultValue={editing?.quantity || 1}
          />
        </div>
        <div className="md:col-span-2">
          <Label>URL da imagem</Label>
          <Input name="image_url" defaultValue={editing?.image_url || ""} />
        </div>
        <div className="md:col-span-2">
          <Label>Descrição</Label>
          <Textarea
            name="description"
            rows={3}
            defaultValue={editing?.description || ""}
          />
        </div>
        <div>
          <Label>Status</Label>
          <select
            name="status"
            defaultValue={editing?.status || "active"}
            className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm"
          >
            <option value="active">Ativo</option>
            <option value="hidden">Oculto</option>
            <option value="completed">Completo</option>
          </select>
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            name="is_priority"
            defaultChecked={Boolean(editing?.is_priority)}
            className="size-4"
          />
          Prioridade (destaque no topo)
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" disabled={pending}>
            {editing ? "Salvar" : "Criar"}
          </Button>
          {editing ? (
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        {gifts.length === 0 ? (
          <p className="text-muted md:col-span-3">Nenhum presente cadastrado.</p>
        ) : (
          gifts.map((gift) => (
            <article
              key={gift.id}
              className="rounded-2xl border border-black/5 bg-white/70 p-4"
            >
              {gift.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={gift.image_url}
                  alt={gift.name}
                  className="mb-3 h-40 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="mb-3 flex h-40 items-center justify-center rounded-xl bg-sand-deep text-muted">
                  Sem imagem
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl">{gift.name}</h3>
                  <p className="text-sm text-muted">
                    {gift.category || "Geral"}
                    {gift.is_priority ? " · Prioridade" : ""}
                  </p>
                </div>
                <p className="font-medium text-terra-deep">
                  {formatCurrency(Number(gift.price))}
                </p>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>
                    {formatCurrency(gift.amount_raised)} /{" "}
                    {formatCurrency(Number(gift.price))}
                  </span>
                  <span>{Math.round(gift.percent)}%</span>
                </div>
                <div className="progress-track h-2 rounded-full">
                  <div
                    className="progress-fill rounded-full"
                    style={{ width: `${gift.percent}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(gift)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    startTransition(async () => {
                      const result = await toggleGiftStatusAction(gift.id, gift.status);
                      if (result.error) toast.error(result.error);
                      else toast.success("Status atualizado");
                    });
                  }}
                >
                  {gift.status === "hidden" ? "Ativar" : "Ocultar"}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (!confirm("Excluir este presente?")) return;
                    startTransition(async () => {
                      const result = await deleteGiftAction(gift.id);
                      if (result.error) toast.error(result.error);
                      else toast.success("Presente excluído");
                    });
                  }}
                >
                  Excluir
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
