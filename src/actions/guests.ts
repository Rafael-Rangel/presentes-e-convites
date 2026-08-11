"use server";

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

export async function createGuestAction(formData: FormData) {
  const supabase = await createClient();
  const weddingId = DEFAULT_WEDDING_ID;
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!name) return { error: "Nome é obrigatório." };

  const slug = await uniqueSlug(createGuestSlug(name), weddingId);

  const { error } = await supabase.from("guests").insert({
    wedding_id: weddingId,
    name,
    slug,
    phone,
    email,
    notes,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/convidados");
  revalidatePath("/admin/convites");
  revalidatePath("/admin");
  return { success: true, slug };
}

export async function createGuestsBulkAction(names: string[]) {
  const supabase = await createClient();
  const weddingId = DEFAULT_WEDDING_ID;
  const cleaned = names.map((n) => n.trim()).filter(Boolean);
  if (!cleaned.length) return { error: "Nenhum nome informado." };

  const rows = [];
  for (const name of cleaned) {
    const slug = await uniqueSlug(createGuestSlug(name), weddingId);
    rows.push({
      wedding_id: weddingId,
      name,
      slug,
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
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;
  const invitation_status = String(formData.get("invitation_status") || "not_sent");

  if (!id || !name) return { error: "Dados inválidos." };

  const slug = await uniqueSlug(
    createGuestSlug(name),
    DEFAULT_WEDDING_ID,
    id,
  );

  const { error } = await supabase
    .from("guests")
    .update({
      name,
      slug,
      phone,
      email,
      notes,
      invitation_status,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/convidados");
  revalidatePath("/admin/convites");
  return { success: true };
}

export async function deleteGuestAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/convidados");
  revalidatePath("/admin/convites");
  revalidatePath("/admin");
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
