import { LoginForm } from "@/components/admin/login-form";
import { HERO_PHOTO } from "@/lib/wedding-media";

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_PHOTO}
        alt="Rafael e Adrielly"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[#2a2420]/55" />
      <div className="glass relative z-10 w-full max-w-md rounded-3xl p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-terra">
            Rafael & Adrielly
          </p>
          <h1 className="mt-2 font-display text-4xl text-terra-deep">Entrar</h1>
          <p className="mt-2 text-sm text-muted">Painel do casamento</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
