"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitRsvpAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const confirmation_status = String(formData.get("confirmation_status") || "");
  const companions_count = Number(formData.get("companions_count") || 0);
  const companionsRaw = String(formData.get("companions") || "");
  const dietary = String(formData.get("dietary") || "").trim() || null;
  const rsvp_notes = String(formData.get("rsvp_notes") || "").trim() || null;

  if (!slug || !["confirmed", "declined"].includes(confirmation_status)) {
    return { error: "Resposta inválida." };
  }

  const companions = companionsRaw
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name }));

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_rsvp", {
    p_slug: slug,
    p_confirmation_status: confirmation_status,
    p_companions_count: companions_count,
    p_companions: companions,
    p_dietary: dietary,
    p_rsvp_notes: rsvp_notes,
  });

  if (error) return { error: error.message };

  revalidatePath(`/casamento/${slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/convidados");
  revalidatePath("/admin/convites");
  return { success: true };
}

export async function trackAccessAction(slug: string, device?: string) {
  const supabase = await createClient();
  await supabase.rpc("track_invitation_access", {
    p_slug: slug,
    p_device: device || null,
  });
  return { success: true };
}
