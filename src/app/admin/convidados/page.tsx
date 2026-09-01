import { GuestsManager } from "@/components/admin/guests-manager";
import { DEFAULT_WEDDING_ID, listGuests } from "@/lib/wedding";

export default async function ConvidadosPage() {
  const guests = await listGuests(DEFAULT_WEDDING_ID);
  return (
    <GuestsManager
      guests={guests}
      appUrl={process.env.NEXT_PUBLIC_APP_URL || "https://rafael-adrielly-ivory.vercel.app"}
    />
  );
}
