// src/lib/db.js
import { supabase } from "./supabaseClient";

/** returns { user, profile-like } from session */
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user || null;
}

/** Find agency tied to the current user (owner or agent via agency_users) */
export async function getCurrentAgency() {
  const user = await getUser();
  if (!user) return null;

  // First, if user is an owner
  let { data: agencies, error } = await supabase
    .from("agencies")
    .select("*")
    .eq("owner_user_id", user.id)
    .limit(1);
  if (error) throw error;
  if (agencies && agencies.length) return agencies[0];

  // Else, via agency_users
  const { data: membership, error: e2 } = await supabase
    .from("agency_users")
    .select("agency_id")
    .eq("user_id", user.id)
    .limit(1);
  if (e2) throw e2;
  if (!membership || !membership.length) return null;

  const agencyId = membership[0].agency_id;
  const { data: ag, error: e3 } = await supabase
    .from("agencies")
    .select("*")
    .eq("id", agencyId)
    .limit(1);
  if (e3) throw e3;
  return ag?.[0] ?? null;
}

/**
 * Upsert the current user's agency by the canonical unique column: slug.
 * Accepts all branding/public fields used by AgencyConsole.
 */
export async function upsertMyAgency(payload) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  // Normalize and build the row
  const row = {
    owner_user_id: user.id,
    name: payload.name,
    slug: payload.slug,                         // must be unique; caller ensures normalization
    logo_url: payload.logo_url ?? null,
    theme: payload.theme ?? null,               // { primary, ink }
    is_public: payload.is_public ?? false,
    public_slug: payload.public_slug || null,   // can be null if not public
    legal_name: payload.legal_name ?? null,
    calendly_url: payload.calendly_url ?? null,
  };

  // Upsert by slug (the real unique constraint)
  const { data, error } = await supabase
    .from("agencies")
    .upsert(row, { onConflict: "slug", ignoreDuplicates: false })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/** List agents (from agency_users) */
export async function listAgentsForMyAgency() {
  const a = await getCurrentAgency();
  if (!a) return [];
  const { data, error } = await supabase
    .from("agency_users")
    .select("user_email, role, progress")
    .eq("agency_id", a.id)
    .order("user_email");
  if (error) throw error;
  return data;
}
