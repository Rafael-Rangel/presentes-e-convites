export const SEAT_PRICE = 175;
/** Cortesia fixa do salão — sempre 24, independente da lista. */
export const VENUE_COURTESY = 24;
export const PARTY_ALREADY_PAID = 6194;

export const PAYMENT_MONTH_LABELS = [
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

/** @deprecated Use summarizeGuestFinance().payableAmount — total agora é dinâmico. */
export const PARTY_TOTAL = 21175;

/** @deprecated Use summarizeGuestFinance().paymentMonths */
export const PAYMENT_MONTHS = PAYMENT_MONTH_LABELS.map((label) => ({
  label,
  amount: 2996.2,
}));

export const GUEST_CATEGORIES = [
  "Convidados Adrielly",
  "Crianças",
  "Pais",
  "Avós",
  "Crianças de cerimônia",
  "Padrinhos",
  "Demoiselles",
  "Amigos dos noivos",
  "Convidados Rafael",
  "Banda",
] as const;

export type GuestCategory = (typeof GUEST_CATEGORIES)[number];

/** Categorias que chegam cedo para participar da cerimônia / cortejo */
export const CEREMONY_PARTICIPANT_CATEGORIES: readonly GuestCategory[] = [
  "Banda",
  "Amigos dos noivos",
  "Crianças de cerimônia",
  "Demoiselles",
  "Padrinhos",
] as const;

export const INVITE_GROUPS = [
  {
    id: "adrielly",
    label: "Adrielly",
    categories: ["Convidados Adrielly"] as const,
  },
  {
    id: "rafael",
    label: "Rafael",
    categories: ["Convidados Rafael"] as const,
  },
  {
    id: "cerimonia",
    label: "Cerimônia",
    categories: CEREMONY_PARTICIPANT_CATEGORIES,
  },
  {
    id: "demoiselles",
    label: "Demoiselles",
    categories: ["Demoiselles"] as const,
  },
  {
    id: "cavalheiros",
    label: "Cavalheiros",
    categories: ["Padrinhos"] as const,
  },
  {
    id: "criancas-cerimonia",
    label: "Crianças cerimônia",
    categories: ["Crianças de cerimônia"] as const,
  },
  {
    id: "pais",
    label: "Pais",
    categories: ["Pais"] as const,
  },
  {
    id: "avos",
    label: "Avós",
    categories: ["Avós"] as const,
  },
  {
    id: "amigos",
    label: "Amigos",
    categories: ["Amigos dos noivos"] as const,
  },
  {
    id: "criancas",
    label: "Crianças",
    categories: ["Crianças"] as const,
  },
  {
    id: "banda",
    label: "Banda",
    categories: ["Banda"] as const,
  },
] as const;

export type InviteGroupId = (typeof INVITE_GROUPS)[number]["id"] | "all";

export function guestMatchesInviteGroup(
  guest: { category: string | null },
  groupId: InviteGroupId,
) {
  if (groupId === "all") return true;
  const group = INVITE_GROUPS.find((item) => item.id === groupId);
  if (!group) return false;
  return Boolean(
    guest.category &&
      (group.categories as readonly string[]).includes(guest.category),
  );
}

export function inviteCategoryLabel(category: string | null) {
  if (category === "Padrinhos") return "Cavalheiros";
  if (category === "Convidados Adrielly") return "Adrielly";
  if (category === "Convidados Rafael") return "Rafael";
  return category || "Sem grupo";
}

export function isCeremonyParticipant(guest: {
  category: string | null;
  slug?: string;
}) {
  if (
    guest.category &&
    (CEREMONY_PARTICIPANT_CATEGORIES as readonly string[]).includes(
      guest.category,
    )
  ) {
    return true;
  }
  return false;
}

export type GuestFinanceRow = {
  category: string | null;
  is_paying: boolean;
  seat_price: number;
  party_size?: number | null;
};

export function guestPartySize(guest: { party_size?: number | null }) {
  const n = Number(guest.party_size);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(50, Math.floor(n));
}

function splitInstallments(remaining: number) {
  const labels = PAYMENT_MONTH_LABELS;
  const count = labels.length;
  const cents = Math.round(Math.max(0, remaining) * 100);
  const base = Math.floor(cents / count);
  const extra = cents - base * count;
  return labels.map((label, index) => ({
    label,
    amount: (base + (index < extra ? 1 : 0)) / 100,
  }));
}

/**
 * Conta sincronizada com a lista (usa party_size de cada convite):
 * pessoas que você paga = total − não pagantes − 24 cortesia (fixas).
 * Convites agrupados continuam 1 link; a contagem usa o nº de pessoas.
 */
export function summarizeGuestFinance(guests: GuestFinanceRow[]) {
  const byCategory = GUEST_CATEGORIES.map((category) => {
    const rows = guests.filter((g) => g.category === category);
    const total = rows.reduce((sum, g) => sum + guestPartySize(g), 0);
    const paying = rows
      .filter((g) => g.is_paying)
      .reduce((sum, g) => sum + guestPartySize(g), 0);
    const free = total - paying;
    return {
      category,
      invites: rows.length,
      total,
      paying,
      free,
      amount: paying * SEAT_PRICE,
    };
  });

  const uncategorized = guests.filter(
    (g) => !g.category || !GUEST_CATEGORIES.includes(g.category as GuestCategory),
  );

  const inviteCount = guests.length;
  const totalPeople = guests.reduce((sum, g) => sum + guestPartySize(g), 0);
  const listNonPaying = guests
    .filter((g) => !g.is_paying)
    .reduce((sum, g) => sum + guestPartySize(g), 0);
  const listPaying = totalPeople - listNonPaying;
  const venueCourtesy = VENUE_COURTESY;
  const totalNonBillable = listNonPaying + venueCourtesy;
  const payingPeople = Math.max(0, totalPeople - listNonPaying - venueCourtesy);
  const theoreticalTotal = totalPeople * SEAT_PRICE;
  const listFreeAmount = listNonPaying * SEAT_PRICE;
  const courtesyAmount = venueCourtesy * SEAT_PRICE;
  const discountTotal = listFreeAmount + courtesyAmount;
  const payableAmount = payingPeople * SEAT_PRICE;
  const remainingAmount = Math.max(0, payableAmount - PARTY_ALREADY_PAID);
  const paymentMonths = splitInstallments(remainingAmount);

  return {
    byCategory,
    uncategorized: uncategorized.reduce(
      (sum, g) => sum + guestPartySize(g),
      0,
    ),
    inviteCount,
    totalPeople,
    listNonPaying,
    listPaying,
    venueCourtesy,
    totalNonBillable,
    payingPeople,
    seatPrice: SEAT_PRICE,
    theoreticalTotal,
    listFreeAmount,
    courtesyAmount,
    discountTotal,
    payableAmount,
    alreadyPaid: PARTY_ALREADY_PAID,
    remainingAmount,
    installmentCount: paymentMonths.length,
    installmentAmount: paymentMonths[0]?.amount ?? 0,
    paymentMonths,
  };
}
