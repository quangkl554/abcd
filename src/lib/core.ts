import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const core = require('./xoso-core.cjs');

export type Region = 'nam' | 'trung' | 'bac';

export type ParsedTicket = {
  id?: string;
  playerName: string;
  region: Region;
  dai: string[];
  loai: string;
  loaiLabel?: string;
  soList: string[];
  tienDat: number;
  chan: number;
  soGiai: number;
  heSoXac: number;
  tyLeTrung: number;
  xac: number;
  sourceText?: string;
  ketQua?: string;
  tienThang?: number;
  ghiChu?: string;
  hits?: unknown[];
};

export type ParsedEnvelope = {
  kind: string;
  region: Region;
  playerName?: string | null;
  tickets?: ParsedTicket[];
  warnings?: string[];
  rawText?: string;
  activeDai?: string[];
  draw?: {
    activeDai?: string[];
    results?: Record<string, Record<string, string[]>>;
  };
};

export default core;

export function canonicalRegion(region: unknown): Region {
  return core.canonicalRegion(region) as Region;
}

export function getConfig(region: unknown) {
  return core.getConfig(canonicalRegion(region));
}

export function getActiveDai(region: Region, date: Date) {
  return core.getActiveDai(region, date) as string[];
}

export function parseEnvelope(input: {
  text: string;
  region: Region;
  date: Date;
  fallbackPlayer?: string | null;
  rates?: unknown;
}): ParsedEnvelope {
  return core.parseMultiTelegramEnvelope({
    text: input.text,
    region: input.region,
    date: input.date,
    fallbackPlayer: input.fallbackPlayer || null,
    rates: input.rates || null,
  }) as ParsedEnvelope;
}

export function parseDrawResultText(text: string, region: Region) {
  return core.parseDrawResultText(text, region) as {
    activeDai: string[];
    results: Record<string, Record<string, string[]>>;
  };
}

export function checkTickets(tickets: ParsedTicket[], drawResults: Record<string, Record<string, string[]>>, options: { region: Region; activeDai: string[] }) {
  return core.checkTickets(tickets, drawResults, options) as ParsedTicket[];
}

export function summarizeTickets(tickets: ParsedTicket[]) {
  return core.summarizeTickets(tickets) as Array<{
    playerName: string;
    soVe: number;
    tongXac: number;
    tongTrung: number;
    laiLo: number;
  }>;
}

export function formatMoney(value: number) {
  return core.formatMoney(value) as string;
}
