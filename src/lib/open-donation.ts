export const OPEN_DONATION_NAME = "Contribuição livre";

export function isOpenDonation(gift: { name?: string | null }) {
  return (gift.name || "").trim().toLowerCase() === OPEN_DONATION_NAME.toLowerCase();
}
