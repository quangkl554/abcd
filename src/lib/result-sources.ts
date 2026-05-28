import type { Region } from './core';

export const DEFAULT_RESULT_SOURCE_URLS: Record<Region, string[]> = {
  nam: ['https://xsmn.net/'],
  trung: ['https://xsmn.net/xsmt'],
  bac: ['https://xsmn.net/xsmb'],
};

export function resultSourceUrls(region: Region, date?: string) {
  const envKey = `RESULT_SOURCE_URL_${region.toUpperCase()}`;
  const multiEnvKey = `RESULT_SOURCE_URLS_${region.toUpperCase()}`;
  const numbered = [1, 2, 3, 4, 5]
    .map(index => process.env[`${envKey}_${index}`])
    .filter(Boolean) as string[];
  const configured = [
    process.env[envKey],
    process.env[multiEnvKey],
    ...numbered,
  ].flatMap(splitSourceList);
  const urls = configured.length ? configured : DEFAULT_RESULT_SOURCE_URLS[region];
  return unique(urls.map(url => formatSourceUrl(url, date, region)).filter(Boolean));
}

export function resultSourceUrl(region: Region, date?: string) {
  return resultSourceUrls(region, date)[0] || '';
}

function splitSourceList(value?: string) {
  return String(value || '')
    .split(/[\n,|]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function formatSourceUrl(url: string, date?: string, region?: Region) {
  if (!date) return url;
  const [yyyy, mm, dd] = date.split('-');
  if (!yyyy || !mm || !dd) return url;
  return url
    .replaceAll('{date}', date)
    .replaceAll('{yyyy-mm-dd}', date)
    .replaceAll('{yyyymmdd}', `${yyyy}${mm}${dd}`)
    .replaceAll('{dd-mm-yyyy}', `${dd}-${mm}-${yyyy}`)
    .replaceAll('{ddmmyyyy}', `${dd}${mm}${yyyy}`)
    .replaceAll('{yyyy}', yyyy)
    .replaceAll('{yy}', yyyy.slice(-2))
    .replaceAll('{mm}', mm)
    .replaceAll('{m}', String(Number(mm)))
    .replaceAll('{dd}', dd)
    .replaceAll('{d}', String(Number(dd)))
    .replaceAll('{region}', region || '');
}
