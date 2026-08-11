"use server";

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_WEDDING_ID } from "@/lib/wedding";
import { revalidatePath } from "next/cache";

export async function createGiftAction(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const image_url = String(formData.get("image_url") || "").trim() || null;
  const price = Number(formData.get("price") || 0);
  const category = String(formData.get("category") || "").trim() || null;
  const quantity = Number(formData.get("quantity") || 1);
  const status = String(formData.get("status") || "active");
  const is_priority = formData.get("is_priority") === "on";

  if (!name || price <= 0) return { error: "Nome e valor são obrigatórios." };

  const { error } = await supabase.from("gifts").insert({
    wedding_id: DEFAULT_WEDDING_ID,
    name,
    description,
    image_url,
    price,
    category,
    quantity,
    status,
    is_priority,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/presentes");
  revalidatePath("/presentes");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateGiftAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const image_url = String(formData.get("image_url") || "").trim() || null;
  const price = Number(formData.get("price") || 0);
  const category = String(formData.get("category") || "").trim() || null;
  const quantity = Number(formData.get("quantity") || 1);
  const status = String(formData.get("status") || "active");
  const is_priority = formData.get("is_priority") === "on";

  if (!id || !name || price <= 0) return { error: "Dados inválidos." };

  const { error } = await supabase
    .from("gifts")
    .update({
      name,
      description,
      image_url,
      price,
      category,
      quantity,
      status,
      is_priority,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/presentes");
  revalidatePath("/presentes");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteGiftAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("gifts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/presentes");
  revalidatePath("/presentes");
  revalidatePath("/admin");
  return { success: true };
}

export async function toggleGiftStatusAction(id: string, status: string) {
  const supabase = await createClient();
  const next = status === "hidden" ? "active" : "hidden";
  const { error } = await supabase.from("gifts").update({ status: next }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/presentes");
  revalidatePath("/presentes");
  return { success: true };
}
