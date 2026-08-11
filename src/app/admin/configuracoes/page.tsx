import { SettingsForm } from "@/components/admin/settings-form";
import { getWedding } from "@/lib/wedding";

export default async function ConfiguracoesPage() {
  const wedding = await getWedding();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-terra-deep">Configurações</h1>
        <p className="text-muted">Dados do casamento e textos do convite</p>
      </div>
      <SettingsForm wedding={wedding} />
    </div>
  );
}
