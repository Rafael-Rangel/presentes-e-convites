export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl text-terra-deep">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
