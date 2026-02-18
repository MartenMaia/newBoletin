import cron from 'node-cron';
import { ingestReportIfAvailable } from '../services/imaIngestService';

function yyyyMmDd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startImaDailyJob(): void {
  // 07:00 America/Sao_Paulo
  cron.schedule(
    '0 7 * * *',
    async function () {
      const now = new Date();
      const today = yyyyMmDd(now);
      const y = new Date(now.getTime());
      y.setDate(y.getDate() - 1);
      const yesterday = yyyyMmDd(y);

      try {
        await ingestReportIfAvailable([today, yesterday]);
      } catch (e) {
        console.error('[IMA JOB] erro', e);
      }
    },
    { timezone: 'America/Sao_Paulo' },
  );
}
