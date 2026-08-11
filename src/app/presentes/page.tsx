import { GiftsPublic } from "@/components/gifts/gifts-public";
import {
  DEFAULT_WEDDING_ID,
  getGuestBySlug,
  getWedding,
  listGifts,
  listPaidContributions,
  withGiftProgress,
} from "@/lib/wedding";

export default async function PresentesPage({
  searchParams,
}: {
  searchParams: Promise<{ guest?: string }>;
}) {
  const { guest: guestSlug } = await searchParams;
  const [wedding, gifts, contributions, guest] = await Promise.all([
    getWedding(),
    listGifts(DEFAULT_WEDDING_ID, true),
    listPaidContributions(DEFAULT_WEDDING_ID),
    guestSlug ? getGuestBySlug(guestSlug) : Promise.resolve(null),
  ]);

  return (
    <GiftsPublic
      gifts={withGiftProgress(gifts, contributions)}
      guestSlug={guest?.slug}
      guestName={guest?.name}
      coupleNames={wedding.settings?.couple_names || wedding.name}
    />
  );
}
