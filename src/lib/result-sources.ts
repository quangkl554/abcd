import type { Region } from './core';

export const RESULT_SOURCE_URLS: Record<Region, string> = {
  nam: 'https://xsmn.net/',
  trung: 'https://xsmn.net/xsmt',
  bac: 'https://xsmn.net/xsmb',
};

export function resultSourceUrl(region: Region) {
  const envKey = `RESULT_SOURCE_URL_${region.toUpperCase()}`;
  return process.env[envKey] || RESULT_SOURCE_URLS[region];
}
