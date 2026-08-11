import { createClient } from "@/lib/supabase/server";
import type { Gift, GiftContribution, GiftWithProgress, Guest, Wedding } from "@/lib/types";

export const DEFAULT_WEDDING_ID =
  process.env.NEXT_PUBLIC_WEDDING_ID || "11111111-1111-1111-1111-111111111111";

export async function getWedding() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weddings")
    .select("*")
    .eq("id", DEFAULT_WEDDING_ID)
    .single();
  if (error) throw error;
  return data as Wedding;
}

export async function getAdminWeddingId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("wedding_id")
    .eq("id", user.id)
    .maybeSingle();

  return data?.wedding_id || DEFAULT_WEDDING_ID;
}

export async function listGuests(weddingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("name");
  if (error) throw error;
  return (data || []) as Guest[];
}

export async function getGuestBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as Guest | null;
}

export async function listGifts(weddingId: string, publicOnly = false) {
  const supabase = await createClient();
  let query = supabase.from("gifts").select("*").eq("wedding_id", weddingId);
  if (publicOnly) {
    query = query.in("status", ["active", "completed"]);
  }
  const { data, error } = await query
    .order("is_priority", { ascending: false })
    .order("name");
  if (error) throw error;
  return (data || []) as Gift[];
}

export async function listPaidContributions(weddingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gift_contributions")
    .select("*")
    .eq("wedding_id", weddingId)
    .eq("payment_status", "paid")
    .order("paid_at", { ascending: false });
  if (error) throw error;
  return (data || []) as GiftContribution[];
}

export function withGiftProgress(
  gifts: Gift[],
  contributions: GiftContribution[],
): GiftWithProgress[] {
  return gifts.map((gift) => {
    const amount_raised = contributions
      .filter((c) => c.gift_id === gift.id)
      .reduce((sum, c) => sum + Number(c.amount), 0);
    const price = Number(gift.price) || 0;
    const percent = price > 0 ? Math.min(100, (amount_raised / price) * 100) : 0;
    return { ...gift, amount_raised, percent };
  });
}
