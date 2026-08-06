import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  console.warn(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — auth and data calls will fail until .env is set.",
  );
}

/** Untyped client for scaffold; regenerate Database types from Supabase CLI when connected. */
export const supabase = createClient(
  url ?? "http://127.0.0.1:54321",
  anon ?? "public-anon-key",
);

export function functionsBase(): string {
  return (
    (import.meta.env.VITE_FUNCTIONS_URL as string | undefined) ??
    `${url ?? ""}/functions/v1`
  );
}

export async function invokeFunction<T>(
  name: string,
  body: unknown,
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not signed in");

  const res = await fetch(`${functionsBase()}/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      apikey: anon ?? "",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      (json as { error?: string }).error || `Function ${name} failed (${res.status})`,
    );
  }
  return json;
}
