"use client";

import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const clockError =
    searchParams.get("erro") === "relogio"
      ? "O relógio do Windows está dessincronizado. Ative “Definir hora automaticamente” e entre de novo."
      : null;
  const [error, setError] = useState<string | null>(clockError);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        startTransition(async () => {
          const result = await loginAction(formData);
          if (result?.error) setError(result.error);
        });
      }}
    >
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="seu@email.com"
          autoComplete="email"
        />
      </div>
      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          required
          placeholder="Senha numérica"
          autoComplete="current-password"
        />
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
      <p className="text-center text-sm text-muted">
        <Link href="/admin/recuperar-senha" className="text-serene-deep underline">
          Esqueci minha senha
        </Link>
      </p>
    </form>
  );
}
