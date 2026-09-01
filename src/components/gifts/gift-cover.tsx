import { cn } from "@/lib/utils";
import {
  Archive,
  Bath,
  BedDouble,
  Blender,
  Coffee,
  CookingPot,
  Fan,
  Frame,
  Gift,
  Heart,
  LampDesk,
  Microwave,
  Package,
  Plane,
  Refrigerator,
  Shirt,
  Sofa,
  Table2,
  Trash2,
  Tv,
  UtensilsCrossed,
  type LucideIcon,
  Waves,
  Wind,
} from "lucide-react";

const ICON_RULES: { test: RegExp; icon: LucideIcon }[] = [
  { test: /geladeira|refriger/i, icon: Refrigerator },
  { test: /fog[aã]o/i, icon: CookingPot },
  { test: /m[aá]quina|lavar|lava[- ]?lou/i, icon: Waves },
  { test: /micro/i, icon: Microwave },
  { test: /cama|travesseiro|jogo de cama/i, icon: BedDouble },
  { test: /sof[aá]|almofada/i, icon: Sofa },
  { test: /\btv\b|televis|rack/i, icon: Tv },
  { test: /contribui|doa[cç]|livre/i, icon: Heart },
  { test: /lua|mel|viagem/i, icon: Plane },
  { test: /mesa/i, icon: Table2 },
  { test: /arm[aá]rio|guarda-roupa|criado/i, icon: Archive },
  { test: /escrivaninha|trabalho|escrit/i, icon: LampDesk },
  { test: /panela|facas|utens[ií]lio|talher|lou[cç]a|pote|escorredor/i, icon: UtensilsCrossed },
  { test: /cafeteira|caf[eé]/i, icon: Coffee },
  { test: /sanduicheira|torradeira|airfryer|batedeira|liquidificador/i, icon: Blender },
  { test: /banho|toalha/i, icon: Bath },
  { test: /varal/i, icon: Shirt },
  { test: /ferro|passar/i, icon: Shirt },
  { test: /aspirador/i, icon: Wind },
  { test: /ventilador/i, icon: Fan },
  { test: /cortina|tapete|espelho/i, icon: Frame },
  { test: /lixeira/i, icon: Trash2 },
  { test: /^kit /i, icon: Package },
];

export function resolveGiftIcon(name: string): LucideIcon {
  for (const rule of ICON_RULES) {
    if (rule.test.test(name)) return rule.icon;
  }
  return Gift;
}

/** Paletas suaves no mesmo universo visual do convite */
const COVER_TONES = [
  {
    from: "rgba(244, 235, 227, 0.95)",
    mid: "rgba(232, 214, 198, 0.9)",
    to: "rgba(184, 92, 56, 0.22)",
    ink: "rgba(110, 48, 24, 0.72)",
  },
  {
    from: "rgba(251, 247, 242, 0.96)",
    mid: "rgba(214, 226, 232, 0.88)",
    to: "rgba(93, 127, 150, 0.28)",
    ink: "rgba(63, 93, 114, 0.75)",
  },
  {
    from: "rgba(251, 247, 242, 0.96)",
    mid: "rgba(240, 224, 196, 0.9)",
    to: "rgba(212, 175, 55, 0.28)",
    ink: "rgba(140, 110, 40, 0.72)",
  },
  {
    from: "rgba(244, 235, 227, 0.95)",
    mid: "rgba(226, 210, 200, 0.9)",
    to: "rgba(184, 92, 56, 0.18)",
    ink: "rgba(93, 127, 150, 0.7)",
  },
] as const;

function toneFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) % COVER_TONES.length;
  }
  return COVER_TONES[h] || COVER_TONES[0];
}

type Props = {
  name: string;
  category?: string | null;
  urgent?: boolean;
  gifted?: boolean;
  className?: string;
};

export function GiftCover({ name, category, urgent, gifted, className }: Props) {
  const Icon = resolveGiftIcon(name);
  const tone = gifted
    ? {
        from: "rgba(236, 253, 245, 0.98)",
        mid: "rgba(209, 250, 229, 0.94)",
        to: "rgba(16, 185, 129, 0.32)",
        ink: "rgba(4, 120, 87, 0.82)",
      }
    : urgent
      ? {
          from: "rgba(254, 242, 242, 0.96)",
          mid: "rgba(254, 226, 226, 0.9)",
          to: "rgba(220, 38, 38, 0.22)",
          ink: "rgba(185, 28, 28, 0.78)",
        }
      : toneFor(name + (category || ""));

  return (
    <div
      className={cn(
        "gift-cover relative flex h-24 w-full items-center justify-center overflow-hidden sm:h-28",
        className,
      )}
      style={{
        background: `linear-gradient(145deg, ${tone.from} 0%, ${tone.mid} 48%, ${tone.to} 100%)`,
      }}
      aria-hidden
    >
      <div className="gift-cover-pattern pointer-events-none absolute inset-0 opacity-50" />
      <div className="gift-cover-glow pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/35 blur-2xl" />
      <div className="gift-cover-glow pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-[rgba(212,175,55,0.18)] blur-2xl" />
      <div
        className="relative z-[1] flex size-12 items-center justify-center rounded-2xl border border-white/55 bg-white/45 shadow-[0_8px_20px_rgba(42,36,32,0.08)] backdrop-blur-[2px] sm:size-14"
        style={{ color: tone.ink }}
      >
        <Icon size={28} strokeWidth={1.5} />
      </div>
    </div>
  );
}
