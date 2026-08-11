import { ResetForm } from "@/components/admin/reset-form";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass w-full max-w-md rounded-3xl p-8">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl text-terra-deep">Recuperar senha</h1>
          <p className="mt-2 text-sm text-muted">
            Enviaremos um link para o seu e-mail
          </p>
        </div>
        <ResetForm />
      </div>
    </main>
  );
}
