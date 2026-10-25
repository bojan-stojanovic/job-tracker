import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Used only by the mock seed data. Real requests use the signed-in user.
export const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function getCurrentUserId(): Promise<string> {
  // Marks the caller as per-request, so the auth check (which reads the
  // clock to test token expiry) runs at request time, not at build time.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The proxy already redirects, so this is a backstop for any path it
  // doesn't cover.
  if (!user) redirect("/login");

  return user.id;
}