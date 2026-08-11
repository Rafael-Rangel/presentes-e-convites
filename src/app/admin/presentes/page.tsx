import { GiftsManager } from "@/components/admin/gifts-manager";
import {
  DEFAULT_WEDDING_ID,
  listGifts,
  listPaidContributions,
  withGiftProgress,
} from "@/lib/wedding";

export default async function AdminPresentesPage() {
  const [gifts, contributions] = await Promise.all([
    listGifts(DEFAULT_WEDDING_ID),
    listPaidContributions(DEFAULT_WEDDING_ID),
  ]);

  return <GiftsManager gifts={withGiftProgress(gifts, contributions)} />;
}
