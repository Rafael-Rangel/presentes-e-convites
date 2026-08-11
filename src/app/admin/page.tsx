import { DashboardRealtime } from "@/components/admin/dashboard-realtime";
import {
  DEFAULT_WEDDING_ID,
  listGuests,
  listPaidContributions,
} from "@/lib/wedding";

export default async function AdminDashboardPage() {
  const [guests, contributions] = await Promise.all([
    listGuests(DEFAULT_WEDDING_ID),
    listPaidContributions(DEFAULT_WEDDING_ID),
  ]);

  return (
    <DashboardRealtime
      weddingId={DEFAULT_WEDDING_ID}
      initialGuests={guests}
      initialContributions={contributions}
    />
  );
}
