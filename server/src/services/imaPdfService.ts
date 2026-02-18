import crypto from 'node:crypto';
import pdf from 'pdf-parse';

export type ParsedPointSample = {
  city: string;
  pointNumber: number;
  balnearioName: string;
  locationText: string;
  sampleDateIso: string; // YYYY-MM-DD
  status: 'PROPRIA' | 'IMPROPRIA' | 'INDETERMINADO';
};

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

export async function downloadPdf(url: string): Promise<{ buffer: Buffer; checksum: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao baixar PDF: ' + res.status);
  const ab = await res.arrayBuffer();
  const buffer = Buffer.from(ab);
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
  return { buffer, checksum };
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return String(data.text || '');
}

function findFlorianopolisSection(text: string): string {
  const t = text.replace(/\r/g, '');
  const idx = t.toUpperCase().indexOf('FLORIANÓPOLIS');
  const idx2 = idx >= 0 ? idx : t.toUpperCase().indexOf('FLORIANOPOLIS');
  if (idx2 < 0) throw new Error('Seção FLORIANÓPOLIS não encontrada');

  const after = t.slice(idx2);
  // Heurística: próximo município costuma estar em caixa alta e em linha isolada.
  // Procuramos a próxima linha que pareça um cabeçalho de município diferente.
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

    const up = normalizeText(line).toUpperCase();
    const isAllCaps = up === up.toUpperCase() && /[A-Z]/.test(up) && !/PONTO\s+\d+/.test(up);

    // Para parar, exigimos que seja um cabeçalho plausível e diferente de FLORIANOPOLIS
    if (isAllCaps && up.length <= 40 && up !== 'FLORIANOPOLIS' && up !== 'FLORIANOPOLIS - SC') {
      // alguns PDFs repetem cabeçalhos internos; evitamos parar se a linha tem data/status
      if (!/\d{2}\/\d{2}\/\d{4}/.test(line) && !/PROPRIA|IMPROPRIA|INDETERMINADO/i.test(up)) {
        break;
      }
    }

    out.push(line);
  }

  return out.join('\n');
}

export function parseFlorianopolisPoints(text: string): ParsedPointSample[] {
  const section = findFlorianopolisSection(text);
  const lines = section
    .split('\n')
    .map(function (l) {
      return l.trim();
    })
    .filter(function (l) {
      return l.length > 0;
    });

  const results: ParsedPointSample[] = [];

  let currentHeader: string | null = null;
  let currentPointNumber: number | null = null;
  let currentLocationLines: string[] = [];

  function flushIfComplete(sampleLine: string): void {
    if (!currentHeader || currentPointNumber == null) return;

    const dateMatch = sampleLine.match(/(\d{2}\/\d{2}\/\d{4})/);
    const statusMatch = sampleLine.match(/PRÓPRIA|IMPRÓPRIA|INDETERMINADO/i);
    if (!dateMatch || !statusMatch) return;

    const sampleDateIso = isoFromPtBrDate(dateMatch[1]);
    const status = statusFromRaw(statusMatch[0]);
    if (!status) return;

    results.push({
      city: 'Florianópolis',
      pointNumber: currentPointNumber,
      balnearioName: currentHeader,
      locationText: currentLocationLines.join(' ').trim(),
      sampleDateIso: sampleDateIso,
      status: status,
    });

    // reseta localização para evitar misturar com próximo ponto
    currentLocationLines = [];
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const pointMatch = line.match(/\(\s*Ponto\s*(\d+)\s*\)/i);
    if (pointMatch) {
      currentHeader = line;
      currentPointNumber = Number(pointMatch[1]);
      currentLocationLines = [];
      continue;
    }

    // Se tem data+status na mesma linha, é a linha de amostra
    if (/\d{2}\/\d{2}\/\d{4}/.test(line) && /PRÓPRIA|IMPRÓPRIA|INDETERMINADO/i.test(line)) {
      flushIfComplete(line);
      continue;
    }

    // senão, é parte do locationText
    if (currentHeader) currentLocationLines.push(line);
  }

  return results;
}
