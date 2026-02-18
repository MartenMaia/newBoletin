import { BalneabilidadeStatus } from '@prisma/client';
import { getPrisma } from '../db';
import { downloadPdf, extractTextFromPdf, parseFlorianopolisPoints } from './imaPdfService';

export function toReportUrl(dateIso: string): string {
  return `https://balneabilidade.ima.sc.gov.br/relatorio/downloadPDF/${dateIso}`;
}

export async function urlExists(url: string): Promise<boolean> {
  // HEAD costuma funcionar, mas alguns servidores bloqueiam; fallback GET.
  try {
    const head = await fetch(url, { method: 'HEAD' });
    if (head.status === 200) return true;
    if (head.status === 404) return false;
  } catch {
    // ignore
  }

  try {
    const res = await fetch(url, { method: 'GET' });
    if (res.status === 200) return true;
    if (res.status === 404) return false;
    return false;
  } catch {
    return false;
  }
}

export async function ingestReportIfAvailable(candidates: string[]): Promise<{ ingested: boolean; reportDate?: string }> {
  const prisma = getPrisma();

  for (const dateIso of candidates) {
    const exists = await urlExists(toReportUrl(dateIso));
    if (!exists) continue;

    const already = await prisma.balneabilidadeReport.findUnique({ where: { reportDate: dateIso } });
    if (already) return { ingested: false, reportDate: dateIso };

    const url = toReportUrl(dateIso);
    const downloadedAt = new Date();
    const { buffer, checksum } = await downloadPdf(url);

    // evita duplicidade por checksum
    const dup = await prisma.balneabilidadeReport.findFirst({ where: { checksum } });
    if (dup) {
      await prisma.balneabilidadeReport.create({
        data: {
          reportDate: dateIso,
          sourceUrl: url,
          downloadedAt,
          parsedAt: new Date(),
          checksum,
        },
      });
      return { ingested: true, reportDate: dateIso };
    }

    const text = await extractTextFromPdf(buffer);
    const parsedAt = new Date();
    const points = parseFlorianopolisPoints(text);

    const report = await prisma.balneabilidadeReport.create({
      data: {
        reportDate: dateIso,
        sourceUrl: url,
        downloadedAt,
        parsedAt,
        checksum,
      },
    });

    for (const p of points) {
      const point = await prisma.balneabilidadePoint.upsert({
        where: { city_pointNumber: { city: 'Florianópolis', pointNumber: p.pointNumber } },
        create: {
          city: 'Florianópolis',
          pointNumber: p.pointNumber,
          balnearioName: p.balnearioName,
          locationText: p.locationText,
        },
        update: {
          balnearioName: p.balnearioName,
          locationText: p.locationText,
        },
      });

      await prisma.balneabilidadeSample.upsert({
        where: { pointId_sampleDate: { pointId: point.id, sampleDate: new Date(p.sampleDateIso + 'T00:00:00.000Z') } },
        create: {
          pointId: point.id,
          sampleDate: new Date(p.sampleDateIso + 'T00:00:00.000Z'),
          status: p.status as BalneabilidadeStatus,
          reportId: report.id,
        },
        update: {
          status: p.status as BalneabilidadeStatus,
          reportId: report.id,
        },
      });
    }

    return { ingested: true, reportDate: dateIso };
  }

  return { ingested: false };
}
