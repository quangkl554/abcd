export function todayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

export function parseWorkDate(value: unknown) {
  if (!value) return new Date();
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return new Date(`${text}T12:00:00+07:00`);
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Ngay khong hop le: ${text}`);
  return parsed;
}

export function assertDateKey(value: unknown) {
  const text = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error('Ngay phai co dang YYYY-MM-DD');
  return text;
}
