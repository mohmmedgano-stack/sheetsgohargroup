// تواريخ بالتوقيت المحلي للجهاز (مصر). استخدام toISOString() بيرجّع تاريخ UTC،
// فبين 12 بالليل و3 الفجر بتوقيت القاهرة كان "النهاردة" بيطلع "إمبارح".
const pad = (n: number) => String(n).padStart(2, '0');

/** YYYY-MM-DD بالتوقيت المحلي */
export function toLocalDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** YYYY-MM-DD HH:mm:ss بالتوقيت المحلي */
export function toLocalDateTimeStr(d: Date = new Date()): string {
  return `${toLocalDateStr(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** "12/10 07:10 م" — when a client was added (exact time when known, date only for older records). */
export function formatAddedAt(c: { addedAt?: string; createdAt?: string }): string {
  if (c.addedAt) {
    const d = new Date(c.addedAt);
    if (!isNaN(d.getTime())) {
      const date = d.toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo', day: 'numeric', month: 'numeric', year: '2-digit' });
      const time = d.toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: 'numeric', minute: '2-digit', hour12: true });
      return `${date} ${time}`;
    }
  }
  if (c.createdAt) {
    const d = new Date(c.createdAt.length <= 10 ? c.createdAt + 'T00:00:00' : c.createdAt);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'numeric', year: '2-digit' });
  }
  return '';
}
