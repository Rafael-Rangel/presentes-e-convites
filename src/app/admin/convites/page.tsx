import { InvitesManager } from "@/components/admin/invites-manager";
import {
  DEFAULT_WEDDING_ID,
  listGuests,
  listPaidContributions,
} from "@/lib/wedding";

export default async function ConvitesPage() {
  const [guests, contributions] = await Promise.all([
    listGuests(DEFAULT_WEDDING_ID),
    listPaidContributions(DEFAULT_WEDDING_ID),
  ]);

  return (
    <InvitesManager
      guests={guests}
      contributions={contributions}
      appUrl={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
    />
  );
}
