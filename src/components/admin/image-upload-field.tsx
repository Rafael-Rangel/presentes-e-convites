"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { ImagePlus, Link2, Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

type Props = {
  name: string;
  label?: string;
  defaultValue?: string | null;
  folder?: string;
  hint?: string;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";

function publicUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/wedding-media/${path}`;
}

export function ImageUploadField({
  name,
  label = "Imagem",
  defaultValue = "",
  folder = "gifts",
  hint = "Envie do computador ou celular, ou cole uma URL",
}: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue || "");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setUrl(defaultValue || "");
  }, [defaultValue]);

  async function onFileChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Imagem muito grande. Máximo 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Faça login no admin para enviar imagens.");
      }

      const ext =
        file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
        "jpg";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("wedding-media")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/jpeg",
        });

      if (uploadError) throw new Error(uploadError.message);

      const nextUrl = publicUrl(path);
      setUrl(nextUrl);
      toast.success("Imagem enviada");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao enviar imagem",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <p className="text-xs text-muted">{hint}</p>

      {url ? (
        <div className="relative overflow-hidden rounded-xl border border-black/10 bg-white/70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Prévia"
            className="h-44 w-full object-cover"
          />
          <button
            type="button"
            onClick={() => setUrl("")}
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white backdrop-blur-sm"
          >
            <X size={12} />
            Remover
          </button>
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-black/15 bg-white/50 text-sm text-muted">
          Sem imagem
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[rgba(212,175,55,0.45)] bg-white/80 px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-white disabled:opacity-50">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          {uploading ? "Enviando..." : "Carregar arquivo"}
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            disabled={uploading}
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      <div className="relative">
        <Link2
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <Input
          id={inputId}
          name={name}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://... ou envie um arquivo acima"
          className="pl-9"
        />
      </div>
    </div>
  );
}
