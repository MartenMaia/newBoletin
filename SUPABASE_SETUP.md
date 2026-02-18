# Supabase Setup (Edge-only)

Project ref: `jxzxtxayinqescmtuilp`
Project URL: `https://jxzxtxayinqescmtuilp.supabase.co`

## 0) Secrets (Dashboard)
Go to **Project Settings → Edge Functions → Secrets** and set:

- `SUPABASE_SERVICE_ROLE_KEY` = (service role key)  
- `SUPABASE_ANON_KEY` = (anon key)  
- `EDGE_CRON_SECRET` = `BzkOkjwogsKuv1w4`

**Never** put service role key in frontend code.

## 1) SQL migrations (Dashboard → SQL Editor)
Run these files in order (copy/paste):

1. `supabase/migrations/20260218_01_init_balneabilidade.sql`
2. `supabase/migrations/20260218_02_cron_ima_ingest.sql`
   - Replace `<EDGE_CRON_SECRET>` with your secret.

## 2) Edge Functions (Dashboard)
Go to **Edge Functions** and create/deploy:

- Function `ima-ingest` → paste: `supabase/functions/ima-ingest/index.ts`
- Function `balneabilidade-api` → paste: `supabase/functions/balneabilidade-api/index.ts`

Also ensure shared files are present (Supabase supports `_shared` import):
- `supabase/functions/_shared/cors.ts`
- `supabase/functions/_shared/supabase.ts`

## 3) Manual test
### 3.1 Ingest now
Call the edge function with your cron secret:

```bash
curl -i \
  -X POST \
  'https://jxzxtxayinqescmtuilp.functions.supabase.co/ima-ingest' \
  -H 'Authorization: Bearer BzkOkjwogsKuv1w4' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### 3.2 API status (requires logged-in user JWT)
```bash
curl -i \
  'https://jxzxtxayinqescmtuilp.functions.supabase.co/balneabilidade-api' \
  -H 'Authorization: Bearer <USER_JWT>'
```

### 3.3 List points
```bash
curl -i \
  'https://jxzxtxayinqescmtuilp.functions.supabase.co/balneabilidade-api/points?includeUnmapped=true' \
  -H 'Authorization: Bearer <USER_JWT>'
```

### 3.4 Map point → bairro (admin only)
```bash
curl -i \
  -X PATCH \
  'https://jxzxtxayinqescmtuilp.functions.supabase.co/balneabilidade-api/points/<POINT_ID>/map-bairro' \
  -H 'Authorization: Bearer <USER_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"bairro_id":"<BAIRRO_UUID>"}'
```

## Notes
- Cron timezone: `pg_cron` uses the database server timezone. If needed, we can `ALTER DATABASE ... SET timezone TO 'America/Sao_Paulo';`.
- Ingest is protected by `EDGE_CRON_SECRET` (Bearer token).
