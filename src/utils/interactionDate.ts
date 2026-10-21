// أدوات قراءة وقت التفاعلات: التفاعلات الجديدة بتحمل `at` (ISO)،
// أما القديمة فتاريخها نص عربي زي "١١‏/١٠‏/٢٠٢٦، ١:٤٧:٠٠ ص" فبنحوّله هنا.

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function toLatinDigits(input: string): string {
  return input.replace(/[٠-٩]/g, d => String(AR_DIGITS.indexOf(d)));
}

export function parseInteractionDate(note: { at?: string; date: string }): Date | null {
  if (note.at) {
    const d = new Date(note.at);
    if (!isNaN(d.getTime())) return d;
  }
  const raw = toLatinDigits(note.date || '').replace(/[‎‏]/g, '').trim();

  // صيغة ISO أو YYYY-MM-DD [HH:mm[:ss]]
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (iso) {
    return new Date(+iso[1], +iso[2] - 1, +iso[3], +(iso[4] || 0), +(iso[5] || 0), +(iso[6] || 0));
  }

  // صيغة d/m/yyyy[، h:mm:ss ص|م]
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,،\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([صم])?)?/);
  if (m) {
    let h = +(m[4] || 0);
    if (m[7] === 'م' && h < 12) h += 12;
    if (m[7] === 'ص' && h === 12) h = 0;
    return new Date(+m[3], +m[2] - 1, +m[1], h, +(m[5] || 0), +(m[6] || 0));
  }
  return null;
}

// مفتاح اليوم بالتوقيت المحلي (YYYY-MM-DD)
export function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

export function formatDayLabel(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}
