import { DashboardRealtime } from "@/components/admin/dashboard-realtime";
import { PendingPixList } from "@/components/admin/pending-pix-list";
import {
  DEFAULT_WEDDING_ID,
  listGifts,
  listGuests,
  listPaidContributions,
  listPendingPixContributions,
} from "@/lib/wedding";

export default async function AdminDashboardPage() {
  const [guests, contributions, pendingPix, gifts] = await Promise.all([
    listGuests(DEFAULT_WEDDING_ID),
    listPaidContributions(DEFAULT_WEDDING_ID),
    listPendingPixContributions(DEFAULT_WEDDING_ID),
    listGifts(DEFAULT_WEDDING_ID),
  ]);

  return (
    <div className="space-y-6">
      <PendingPixList items={pendingPix} />
      <DashboardRealtime
        weddingId={DEFAULT_WEDDING_ID}
        initialGuests={guests}
        initialContributions={contributions}
        gifts={gifts}
      />
    </div>
  );
}
