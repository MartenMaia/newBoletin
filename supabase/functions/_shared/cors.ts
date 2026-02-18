export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
};

export function withCors(resp: Response): Response {
  const h = new Headers(resp.headers);
  Object.entries(corsHeaders).forEach(function ([k, v]) {
    h.set(k, v);
  });
  return new Response(resp.body, { status: resp.status, headers: h });
}
