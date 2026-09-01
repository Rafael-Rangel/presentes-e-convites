import { createGuestSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { handleSupabaseError } from "@/lib/supabase/errors";
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
  await handleSupabaseError(error);
  return data as Wedding;
}

export async function getAdminWeddingId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("wedding_id")
    .eq("id", user.id)
    .maybeSingle();
  await handleSupabaseError(error, { admin: true });

  return data?.wedding_id || DEFAULT_WEDDING_ID;
}

export async function listGuests(weddingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("name");
  await handleSupabaseError(error, { admin: true });
  return (data || []) as Guest[];
}

export async function getGuestBySlug(slug: string) {
  const supabase = await createClient();
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    decoded = slug;
  }
  const normalized = createGuestSlug(decoded);

  const first = await supabase
    .from("guests")
    .select("*")
    .eq("slug", decoded)
    .maybeSingle();
  await handleSupabaseError(first.error);

  if (first.data) return first.data as Guest;

  if (normalized && normalized !== decoded) {
    const second = await supabase
      .from("guests")
      .select("*")
      .eq("slug", normalized)
      .maybeSingle();
    await handleSupabaseError(second.error);
    return (second.data as Guest | null) ?? null;
  }

  return null;
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
  await handleSupabaseError(error, { admin: !publicOnly });
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
  await handleSupabaseError(error);
  return (data || []) as GiftContribution[];
}

export async function listPendingPixContributions(weddingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gift_contributions")
    .select("*")
    .eq("wedding_id", weddingId)
    .eq("payment_method", "pix")
    .eq("payment_status", "pending")
    .order("created_at", { ascending: false });
  await handleSupabaseError(error, { admin: true });
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
