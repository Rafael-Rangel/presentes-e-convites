"use client";

import { updateWeddingAction } from "@/actions/wedding";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Wedding } from "@/lib/types";
import { useTransition } from "react";
import { toast } from "sonner";

export function SettingsForm({ wedding }: { wedding: Wedding }) {
  const settings = wedding.settings || {};
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        startTransition(async () => {
          const result = await updateWeddingAction(formData);
          if (result.error) toast.error(result.error);
          else toast.success("Configurações salvas");
        });
      }}
    >
      <div>
        <Label>Nome do casamento</Label>
        <Input name="name" defaultValue={wedding.name} required />
      </div>
      <div>
        <Label>Nomes dos noivos</Label>
        <Input
          name="couple_names"
          defaultValue={settings.couple_names || wedding.name}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label>Data</Label>
          <Input name="date" type="date" defaultValue={wedding.date || ""} />
        </div>
        <div>
          <Label>Chegada dos convidados</Label>
          <Input
            name="arrival_time"
            defaultValue={settings.arrival_time || ""}
            placeholder="17:45"
          />
        </div>
        <div>
          <Label>Chegada da cerimônia (padrinhos)</Label>
          <Input
            name="ceremony_arrival_time"
            defaultValue={settings.ceremony_arrival_time || ""}
            placeholder="17:15"
          />
        </div>
        <div>
          <Label>Início do cortejo</Label>
          <Input
            name="ceremony_time"
            defaultValue={settings.ceremony_time || ""}
            placeholder="18:15"
          />
        </div>
      </div>
      <div>
        <Label>Local</Label>
        <Input name="location" defaultValue={wedding.location || ""} />
      </div>
      <div>
        <Label>Endereço</Label>
        <Input name="address" defaultValue={settings.address || ""} />
      </div>
      <div>
        <Label>Link do mapa</Label>
        <Input name="map_url" defaultValue={settings.map_url || ""} />
      </div>
      <div>
        <ImageUploadField
          name="hero_image"
          label="Imagem de capa (hero)"
          defaultValue={settings.hero_image || ""}
          folder="hero"
          hint="Toque para escolher da galeria/câmera ou cole uma URL"
        />
      </div>
      <div>
        <Label>Mensagem de boas-vindas</Label>
        <Textarea
          name="welcome_message"
          rows={3}
          defaultValue={settings.welcome_message || ""}
        />
      </div>
      <div>
        <Label>História do casal</Label>
        <Textarea name="story" rows={5} defaultValue={settings.story || ""} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Horário da recepção</Label>
          <Input
            name="reception_time"
            defaultValue={settings.reception_time || ""}
          />
        </div>
        <div>
          <Label>Dress code</Label>
          <Input name="dress_code" defaultValue={settings.dress_code || ""} />
        </div>
      </div>
      <div>
        <Label>Informações adicionais</Label>
        <Textarea
          name="additional_info"
          rows={3}
          defaultValue={settings.additional_info || ""}
        />
      </div>
      <div>
        <Label>Galeria (uma URL por linha)</Label>
        <Textarea
          name="gallery"
          rows={4}
          defaultValue={(settings.gallery || []).join("\n")}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar configurações"}
      </Button>
    </form>
  );
}
