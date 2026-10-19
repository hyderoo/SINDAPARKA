import { createClient } from "@supabase/supabase-js";

// The project URL and the publishable key are public by design (they ship in every browser bundle).
// Access control is enforced by Row Level Security in the database, not by hiding these values.
// Never put a service_role key in this app.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://uaeahoflhcyexwuykrbp.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_BebDwodvfTYmgKScDzcVbQ_nGqbT27U";

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
