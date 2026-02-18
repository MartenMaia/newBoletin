/// <reference lib="deno.ns" />
import { withCors, corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';

import { getDocument } from 'https://esm.sh/pdfjs-dist@4.10.38/legacy/build/pdf.mjs';

function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function statusFromRaw(raw: string): 'PROPRIA' | 'IMPROPRIA' | 'INDETERMINADO' | null {
  const r = normalizeText(raw).toUpperCase();
  if (r.includes('IMPROPRIA')) return 'IMPROPRIA';
  if (r.includes('PROPRIA')) return 'PROPRIA';
  if (r.includes('INDETERMINADO')) return 'INDETERMINADO';
  return null;
}

function isoFromPtBrDate(d: string): string {
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) throw new Error('Data inválida: ' + d);
  return `${m[3]}-${m[2]}-${m[1]}`;
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(hash);
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function nowSaoPauloDate(): Date {
  // Edge runtime is UTC; derive date parts in America/Sao_Paulo.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  return new Date(`${map.year}-${map.month}-${map.day}T00:00:00.000-03:00`);
}

function reportUrl(dateIso: string): string {
  return `https://balneabilidade.ima.sc.gov.br/relatorio/downloadPDF/${dateIso}`;
}

async function extractTextFromPdf(pdfBytes: Uint8Array): Promise<string> {
  const loadingTask = getDocument({ data: pdfBytes });
  const doc = await loadingTask.promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strs = (content.items as any[]).map(function (it) {
      return String(it.str ?? '');
    });
    pages.push(strs.join('\n'));
  }

  return pages.join('\n');
}

function findFlorianopolisSection(text: string): string {
  const t = text.replace(/\r/g, '');
  const up = t.toUpperCase();
  let idx = up.indexOf('FLORIANÓPOLIS');
  if (idx < 0) idx = up.indexOf('FLORIANOPOLIS');
  if (idx < 0) throw new Error('Seção FLORIANÓPOLIS não encontrada');

  const after = t.slice(idx);
  const lines = after.split('\n').map(function (l) {
    return l.trim();
  });

  const out: string[] = [];
  out.push(lines[0]);

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) {
      out.push(line);
      continue;
    }

    const n = normalizeText(line);
    const nup = n.toUpperCase();
    const isHeader = nup === nup.toUpperCase() && /[A-Z]/.test(nup) && nup.length <= 40;

    if (isHeader && nup !== 'FLORIANOPOLIS' && !/\d{2}\/\d{2}\/\d{4}/.test(line)) {
      // provável próximo município
      if (!/PONTO\s*\d+/i.test(nup)) break;
    }

    out.push(line);
  }

  return out.join('\n');
}

type Parsed = {
  city: string;
  point_number: number;
  balneario_name: string;
  location_text: string;
  sample_date: string; // YYYY-MM-DD
  status: 'PROPRIA' | 'IMPROPRIA' | 'INDETERMINADO';
};

function parseFlorianopolis(text: string): Parsed[] {
  const section = findFlorianopolisSection(text);
  const lines = section
    .split('\n')
    .map(function (l) {
      return l.trim();
    })
    .filter(function (l) {
      return l.length > 0;
    });

  const results: Parsed[] = [];

  let header: string | null = null;
  let pointNumber: number | null = null;
  let loc: string[] = [];

  function flush(sampleLine: string): void {
    if (!header || pointNumber == null) return;
    const dateMatch = sampleLine.match(/(\d{2}\/\d{2}\/\d{4})/);
    const statusMatch = sampleLine.match(/PRÓPRIA|IMPRÓPRIA|INDETERMINADO/i);
    if (!dateMatch || !statusMatch) return;

    const sample_date = isoFromPtBrDate(dateMatch[1]);
    const status = statusFromRaw(statusMatch[0]);
    if (!status) return;

    results.push({
      city: 'Florianópolis',
      point_number: pointNumber,
      balneario_name: header,
      location_text: loc.join(' ').trim(),
      sample_date,
      status,
    });

    loc = [];
  }

  for (const line of lines) {
    const pm = line.match(/\(\s*Ponto\s*(\d+)\s*\)/i);
    if (pm) {
      header = line;
      pointNumber = Number(pm[1]);
      loc = [];
      continue;
    }

    if (/\d{2}\/\d{2}\/\d{4}/.test(line) && /PRÓPRIA|IMPRÓPRIA|INDETERMINADO/i.test(line)) {
      flush(line);
      continue;
    }

    if (header) loc.push(line);
  }

  return results;
}

function requireCronSecret(req: Request): void {
  const expected = Deno.env.get('EDGE_CRON_SECRET');
  if (!expected) throw new Error('Missing EDGE_CRON_SECRET secret');
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
  if (token !== expected) throw new Error('Unauthorized');
}

Deno.serve(async function (req) {
  if (req.method === 'OPTIONS') return withCors(new Response('ok', { headers: corsHeaders }));

  try {
    requireCronSecret(req);

    const base = nowSaoPauloDate();
    const today = ymd(base);
    const yesterday = ymd(new Date(base.getTime() - 24 * 60 * 60 * 1000));

    const candidates = [today, yesterday];

    const sb = supabaseAdmin();

    for (const dateIso of candidates) {
      const url = reportUrl(dateIso);
      const res = await fetch(url);
      if (res.status === 404) continue;
      if (!res.ok) throw new Error('IMA fetch failed: ' + res.status);

      // already ingested?
      const existing = await sb.from('balneabilidade_reports').select('id').eq('report_date', dateIso).maybeSingle();
      if (existing.data) {
        return withCors(Response.json({ ok: true, ingested: false, reason: 'already_ingested', report_date: dateIso }));
      }

      const pdfBuf = await res.arrayBuffer();
      const checksum = await sha256Hex(pdfBuf);

      const dup = await sb.from('balneabilidade_reports').select('id,report_date').eq('checksum', checksum).maybeSingle();

      const downloadedAt = new Date().toISOString();
      const parsedAt = new Date().toISOString();

      const repIns = await sb
        .from('balneabilidade_reports')
        .insert({ report_date: dateIso, source_url: url, checksum, downloaded_at: downloadedAt, parsed_at: parsedAt })
        .select('id')
        .single();

      const reportId = repIns.data.id as string;

      const text = await extractTextFromPdf(new Uint8Array(pdfBuf));
      const parsed = parseFlorianopolis(text);

      let pointsUpserted = 0;
      let samplesInserted = 0;

      for (const p of parsed) {
        const up = await sb
          .from('balneabilidade_points')
          .upsert(
            {
              city: p.city,
              point_number: p.point_number,
              balneario_name: p.balneario_name,
              location_text: p.location_text,
            },
            { onConflict: 'city,point_number' },
          )
          .select('id')
          .single();

        const pointId = up.data.id as string;
        pointsUpserted += 1;

        const insSample = await sb
          .from('balneabilidade_samples')
          .upsert(
            {
              point_id: pointId,
              sample_date: p.sample_date,
              status: p.status,
              report_id: reportId,
            },
            { onConflict: 'point_id,sample_date' },
          );

        if (!insSample.error) samplesInserted += 1;
      }

      return withCors(
        Response.json({
          ok: true,
          ingested: true,
          report_date: dateIso,
          points_parsed: parsed.length,
          points_upserted: pointsUpserted,
          samples_upserted: samplesInserted,
        }),
      );
    }

    return withCors(Response.json({ ok: true, ingested: false, reason: 'no_report_found' }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg === 'Unauthorized' ? 401 : 500;
    return withCors(Response.json({ ok: false, error: msg }, { status }));
  }
});
