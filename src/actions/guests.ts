"use server";

import { GUEST_CATEGORIES, SEAT_PRICE } from "@/lib/guest-finance";
import { createGuestSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_WEDDING_ID } from "@/lib/wedding";
import { revalidatePath } from "next/cache";

async function uniqueSlug(base: string, weddingId: string, excludeId?: string) {
  const supabase = await createClient();
  let slug = base || "convidado";
  let i = 1;

  while (true) {
    let query = supabase
      .from("guests")
      .select("id")
      .eq("wedding_id", weddingId)
      .eq("slug", slug)
      .limit(1);

    if (excludeId) query = query.neq("id", excludeId);

    const { data } = await query.maybeSingle();
    if (!data) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
}

function parseGuestFields(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;
  const categoryRaw = String(formData.get("category") || "").trim();
  const category = GUEST_CATEGORIES.includes(categoryRaw as (typeof GUEST_CATEGORIES)[number])
    ? categoryRaw
    : categoryRaw || null;
  const seatPriceRaw = Number(formData.get("seat_price"));
  const seat_price = Number.isFinite(seatPriceRaw) && seatPriceRaw >= 0
    ? seatPriceRaw
    : SEAT_PRICE;
  const is_paying = String(formData.get("is_paying") || "true") === "true";
  const partySizeRaw = Number(formData.get("party_size"));
  const party_size =
    Number.isFinite(partySizeRaw) && partySizeRaw >= 1
      ? Math.min(50, Math.floor(partySizeRaw))
      : 1;
  return { name, phone, email, notes, category, seat_price, is_paying, party_size };
}

export async function createGuestAction(formData: FormData) {
  const supabase = await createClient();
  const weddingId = DEFAULT_WEDDING_ID;
  const fields = parseGuestFields(formData);

  if (!fields.name) return { error: "Nome é obrigatório." };

  const slug = await uniqueSlug(createGuestSlug(fields.name), weddingId);

  const { error } = await supabase.from("guests").insert({
    wedding_id: weddingId,
    name: fields.name,
    slug,
    phone: fields.phone,
    email: fields.email,
    notes: fields.notes,
    category: fields.category,
    seat_price: fields.seat_price,
    is_paying: fields.is_paying,
    party_size: fields.party_size,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/convidados");
  revalidatePath("/admin/convites");
  revalidatePath("/admin");
  revalidatePath(`/casamento/${slug}`);
  return { success: true, slug };
}

export async function createGuestsBulkAction(
  names: string[],
  category?: string | null,
) {
  const supabase = await createClient();
  const weddingId = DEFAULT_WEDDING_ID;
  const cleaned = names.map((n) => n.trim()).filter(Boolean);
  if (!cleaned.length) return { error: "Nenhum nome informado." };

  const safeCategory =
    category && GUEST_CATEGORIES.includes(category as (typeof GUEST_CATEGORIES)[number])
      ? category
      : category || null;

  const rows = [];
  for (const name of cleaned) {
    const slug = await uniqueSlug(createGuestSlug(name), weddingId);
    rows.push({
      wedding_id: weddingId,
      name,
      slug,
      category: safeCategory,
      seat_price: SEAT_PRICE,
      is_paying: true,
      party_size: 1,
    });
  }

  const { error } = await supabase.from("guests").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/admin/convidados");
  revalidatePath("/admin/convites");
  revalidatePath("/admin");
  return { success: true, count: rows.length };
}

export async function updateGuestAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const fields = parseGuestFields(formData);
  const invitation_status = String(formData.get("invitation_status") || "not_sent");

  if (!id || !fields.name) return { error: "Dados inválidos." };

  const { data: current } = await supabase
    .from("guests")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const slug = await uniqueSlug(
    createGuestSlug(fields.name),
    DEFAULT_WEDDING_ID,
    id,
  );

  const { error } = await supabase
    .from("guests")
    .update({
      name: fields.name,
      slug,
      phone: fields.phone,
      email: fields.email,
      notes: fields.notes,
      invitation_status,
      category: fields.category,
      seat_price: fields.seat_price,
      is_paying: fields.is_paying,
      party_size: fields.party_size,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/convidados");
  revalidatePath("/admin/convites");
  revalidatePath("/admin");
  if (current?.slug) revalidatePath(`/casamento/${current.slug}`);
  revalidatePath(`/casamento/${slug}`);
  return { success: true, slug };
}

export async function deleteGuestAction(id: string) {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("guests")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/convidados");
  revalidatePath("/admin/convites");
  revalidatePath("/admin");
  if (current?.slug) revalidatePath(`/casamento/${current.slug}`);
  return { success: true };
}

export async function markInvitationSentAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("guests")
    .update({ invitation_status: "sent" })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/convites");
  revalidatePath("/admin");
  return { success: true };
}
