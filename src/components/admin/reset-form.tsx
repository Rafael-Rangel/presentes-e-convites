"use client";

import { resetPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, useTransition } from "react";

export function ResetForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        startTransition(async () => {
          const result = await resetPasswordAction(formData);
          if (result.error) {
            setError(result.error);
            setMessage(null);
          } else {
            setMessage(result.success || null);
            setError(null);
          }
        });
      }}
    >
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-serene-deep">{message}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Enviar link"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/admin/login" className="text-serene-deep underline">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
