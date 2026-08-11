export type InvitationStatus = "not_sent" | "sent";
export type ConfirmationStatus = "pending" | "confirmed" | "declined";
export type GiftStatus = "active" | "hidden" | "completed";
export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";
export type PaymentMethod = "pix" | "credit" | "debit";

export type WeddingSettings = {
  couple_names?: string;
  hero_image?: string;
  story?: string;
  ceremony_time?: string;
  reception_time?: string;
  dress_code?: string;
  additional_info?: string;
  gallery?: string[];
  map_url?: string;
  welcome_message?: string;
};

export type Wedding = {
  id: string;
  name: string;
  date: string | null;
  location: string | null;
  settings: WeddingSettings;
  created_at: string;
};

export type Guest = {
  id: string;
  wedding_id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  invitation_status: InvitationStatus;
  confirmation_status: ConfirmationStatus;
  companions: { name: string }[];
  companions_count: number;
  dietary: string | null;
  notes: string | null;
  rsvp_notes: string | null;
  first_accessed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Gift = {
  id: string;
  wedding_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  category: string | null;
  quantity: number;
  status: GiftStatus;
  is_priority: boolean;
  created_at: string;
  updated_at: string;
};

export type GiftContribution = {
  id: string;
  wedding_id: string;
  gift_id: string;
  guest_id: string | null;
  payer_name: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  asaas_payment_id: string | null;
  pix_qr_code: string | null;
  pix_copy_paste: string | null;
  invoice_url: string | null;
  created_at: string;
  paid_at: string | null;
};

export type GiftWithProgress = Gift & {
  amount_raised: number;
  percent: number;
};
