/// <reference lib="deno.ns" />
import { withCors, corsHeaders } from '../_shared/cors.ts';
import { supabaseAuthed } from '../_shared/supabase.ts';
import { z } from 'https://deno.land/x/zod@v3.24.2/mod.ts';

function urlPath(req: Request): string {
  return new URL(req.url).pathname;
}

function stripPrefix(path: string): string {
  // /balneabilidade-api/...
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return '/';
  return '/' + parts.slice(1).join('/');
}

async function requireUser(req: Request) {
  const sb = supabaseAuthed(req);
  const res = await sb.auth.getUser();
  if (!res.data.user) throw new Error('Unauthorized');
  return { sb, user: res.data.user };
}

async function isAdmin(sb: any): Promise<boolean> {
  const prof = await sb.from('profiles').select('role').maybeSingle();
  if (prof.error) return false;
  return prof.data && prof.data.role === 'admin';
}

type BairroRow = { id: string; nome: string };

type PointRow = {
  id: string;
  point_number: number;
  balneario_name: string;
  location_text: string;
  bairro_id: string | null;
};

type SampleRow = { point_id: string; sample_date: string; status: string };

Deno.serve(async function (req) {
  if (req.method === 'OPTIONS') return withCors(new Response('ok', { headers: corsHeaders }));

  try {
    const { sb } = await requireUser(req);

    const path = stripPrefix(urlPath(req));
    const url = new URL(req.url);

    // GET /  => status
    if (req.method === 'GET' && (path === '/' || path === '')) {
      const last = await sb.from('balneabilidade_reports').select('report_date,parsed_at').order('report_date', { ascending: false }).limit(1).maybeSingle();
      const points = await sb.from('balneabilidade_points').select('id,bairro_id');

      const totalPoints = points.data ? points.data.length : 0;
      const totalMapped = points.data ? points.data.filter(function (p: any) { return p.bairro_id != null; }).length : 0;

      return withCors(
        Response.json({
          last_report_date: last.data ? last.data.report_date : null,
          last_ingest_at: last.data ? last.data.parsed_at : null,
          total_points: totalPoints,
          total_mapped: totalMapped,
        }),
      );
    }

    // GET /points
    if (req.method === 'GET' && path === '/points') {
      const bairroId = url.searchParams.get('bairroId');
      const includeUnmapped = (url.searchParams.get('includeUnmapped') ?? 'true') === 'true';

      const bairrosRes = await sb.from('bairros').select('id,nome').order('nome');
      const bairros = (bairrosRes.data ?? []) as BairroRow[];

      let pointsQuery = sb.from('balneabilidade_points').select('id,point_number,balneario_name,location_text,bairro_id').eq('city', 'Florianópolis');
      if (bairroId && bairroId !== 'todos' && bairroId !== 'unmapped') {
        pointsQuery = pointsQuery.eq('bairro_id', bairroId);
      }
      if (bairroId === 'unmapped') {
        pointsQuery = pointsQuery.is('bairro_id', null);
      }
      if (!includeUnmapped && (!bairroId || bairroId === 'todos')) {
        pointsQuery = pointsQuery.not('bairro_id', 'is', null);
      }

      const pointsRes = await pointsQuery.order('point_number');
      const points = (pointsRes.data ?? []) as PointRow[];

      const pointIds = points.map(function (p) { return p.id; });
      let samples: SampleRow[] = [];
      if (pointIds.length > 0) {
        const samplesRes = await sb
          .from('balneabilidade_samples')
          .select('point_id,sample_date,status')
          .in('point_id', pointIds)
          .order('sample_date', { ascending: false });
        samples = (samplesRes.data ?? []) as SampleRow[];
      }

      const byPoint: Record<string, Array<{ date: string; status: string }>> = {};
      samples.forEach(function (s) {
        if (!byPoint[s.point_id]) byPoint[s.point_id] = [];
        if (byPoint[s.point_id].length < 5) {
          byPoint[s.point_id].push({ date: s.sample_date, status: s.status });
        }
      });

      function bairroNome(id: string): string {
        const b = bairros.find(function (x) { return x.id === id; });
        return b ? b.nome : id;
      }

      const groups: Record<string, { bairro_id: string | null; bairro_nome: string; points: any[] }> = {};

      points.forEach(function (p) {
        const key = p.bairro_id ?? 'unmapped';
        if (!groups[key]) {
          groups[key] = {
            bairro_id: p.bairro_id,
            bairro_nome: p.bairro_id ? bairroNome(p.bairro_id) : 'Sem bairro (não mapeado)',
            points: [],
          };
        }
        groups[key].points.push({
          id: p.id,
          point_number: p.point_number,
          balneario_name: p.balneario_name,
          location_text: p.location_text,
          last5: byPoint[p.id] ?? [],
          bairro_id: p.bairro_id,
        });
      });

      const out = Object.values(groups).sort(function (a, b) {
        return a.bairro_nome.localeCompare(b.bairro_nome);
      });

      return withCors(Response.json(out));
    }

    // PATCH /points/:id/map-bairro
    if (req.method === 'PATCH' && path.startsWith('/points/') && path.endsWith('/map-bairro')) {
      const parts = path.split('/').filter(Boolean);
      const pointId = parts[1];

      const okAdmin = await isAdmin(sb);
      if (!okAdmin) return withCors(Response.json({ ok: false, error: 'Forbidden' }, { status: 403 }));

      const body = await req.json();
      const schema = z.object({ bairro_id: z.string().uuid().nullable() });
      const parsed = schema.parse(body);

      const upd = await sb.from('balneabilidade_points').update({ bairro_id: parsed.bairro_id }).eq('id', pointId).select('id,bairro_id').single();
      if (upd.error) throw upd.error;

      return withCors(Response.json({ ok: true, point: upd.data }));
    }

    return withCors(Response.json({ ok: false, error: 'Not found' }, { status: 404 }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg === 'Unauthorized' ? 401 : 500;
    return withCors(Response.json({ ok: false, error: msg }, { status }));
  }
});
