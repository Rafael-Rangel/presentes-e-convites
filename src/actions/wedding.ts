"use server";

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_WEDDING_ID } from "@/lib/wedding";
import { revalidatePath } from "next/cache";

export async function updateWeddingAction(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  const date = String(formData.get("date") || "") || null;
  const location = String(formData.get("location") || "").trim() || null;

  const settings = {
    couple_names: String(formData.get("couple_names") || "").trim(),
    welcome_message: String(formData.get("welcome_message") || "").trim(),
    story: String(formData.get("story") || "").trim(),
    ceremony_time: String(formData.get("ceremony_time") || "").trim(),
    reception_time: String(formData.get("reception_time") || "").trim(),
    dress_code: String(formData.get("dress_code") || "").trim(),
    additional_info: String(formData.get("additional_info") || "").trim(),
    map_url: String(formData.get("map_url") || "").trim(),
    hero_image: String(formData.get("hero_image") || "").trim(),
    gallery: String(formData.get("gallery") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  };

  const { error } = await supabase
    .from("weddings")
    .update({
      name,
      date,
      location,
      settings,
    })
    .eq("id", DEFAULT_WEDDING_ID);

  if (error) return { error: error.message };

  revalidatePath("/admin/configuracoes");
  revalidatePath("/casamento");
  return { success: true };
}
