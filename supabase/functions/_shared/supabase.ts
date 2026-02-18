import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export function getSupabaseUrl(): string {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) throw new Error('Missing SUPABASE_URL');
  return url;
}

export function getServiceRoleKey(): string {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY secret');
  return key;
}

export function getAnonKey(): string {
  const key = Deno.env.get('SUPABASE_ANON_KEY');
  if (!key) throw new Error('Missing SUPABASE_ANON_KEY (set as secret for edge)');
  return key;
}

export function supabaseAdmin() {
  return createClient(getSupabaseUrl(), getServiceRoleKey());
}

export function supabaseAuthed(req: Request) {
  // Uses anon + forwards Authorization header to enforce RLS.
  return createClient(getSupabaseUrl(), getAnonKey(), {
    global: {
      headers: {
        Authorization: req.headers.get('Authorization') ?? '',
      },
    },
  });
}
