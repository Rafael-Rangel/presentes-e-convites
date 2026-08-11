import { InviteExperience } from "@/components/invite/invite-experience";
import { TrackAccess } from "@/components/invite/track-access";
import { getGuestBySlug, getWedding } from "@/lib/wedding";
import { notFound } from "next/navigation";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [guest, wedding] = await Promise.all([
    getGuestBySlug(slug),
    getWedding(),
  ]);

  if (!guest) notFound();

  return (
    <>
      <TrackAccess slug={guest.slug} />
      <InviteExperience guest={guest} wedding={wedding} />
    </>
  );
}
