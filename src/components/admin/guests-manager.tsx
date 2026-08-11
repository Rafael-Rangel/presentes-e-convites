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
import type { Guest } from "@/lib/types";
import Papa from "papaparse";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export function GuestsManager({ guests }: { guests: Guest[] }) {
  const [pending, startTransition] = useTransition();
  const [bulk, setBulk] = useState("");
  const [editing, setEditing] = useState<Guest | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return guests.filter((g) => g.name.toLowerCase().includes(q));
  }, [guests, query]);

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
        <p className="text-muted">Cadastro individual, em lote e importação</p>
      </div>

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
            <Input name="name" required defaultValue={editing?.name || ""} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input name="phone" defaultValue={editing?.phone || ""} />
          </div>
          <div>
            <Label>E-mail (opcional)</Label>
            <Input name="email" type="email" defaultValue={editing?.email || ""} />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea name="notes" defaultValue={editing?.notes || ""} rows={3} />
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
                  const result = await createGuestsBulkAction(bulk.split("\n"));
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
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Confirmação</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Nenhum convidado cadastrado.
                  </td>
                </tr>
              ) : (
                filtered.map((guest) => (
                  <tr key={guest.id} className="border-b border-black/5">
                    <td className="px-4 py-3 font-medium">{guest.name}</td>
                    <td className="px-4 py-3">{guest.phone || "—"}</td>
                    <td className="px-4 py-3">/casamento/{guest.slug}</td>
                    <td className="px-4 py-3 capitalize">{guest.confirmation_status}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
