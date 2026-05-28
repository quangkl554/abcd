import { getActiveDai, getConfig, type Region } from '@/lib/core';
import { parseWorkDate } from '@/lib/dates';
import { resultSourceUrl, resultSourceUrls } from '@/lib/result-sources';

export type RegionScope = Region | 'all';

type TicketLike = {
  id?: string;
  ticket_message_id?: string | null;
  player_id?: string | null;
  player_name?: string | null;
  region?: Region;
  dai?: string[] | null;
  loai?: string | null;
  loai_label?: string | null;
  status?: string | null;
  xac?: number | string | null;
  tien_thang?: number | string | null;
  source_text?: string | null;
};

type MessageLike = {
  id: string;
  raw_text?: string | null;
};

export type TicketTotals = {
  tickets: number;
  checked: number;
  hitCount: number;
  xac: number;
  win: number;
  net: number;
  averageXac: number;
  checkedRate: number;
  hitRate: number;
  payoutRate: number;
};

export type MetricRow = {
  label: string;
  count: number;
  xac: number;
  win: number;
  net: number;
};

export type PlayerSummaryRow = {
  playerId: string | null;
  playerName: string;
  soVe: number;
  tongXac: number;
  tongTrung: number;
  laiLo: number;
};

type DailySummaryLike = {
  region?: Region;
  player_name?: string | null;
  so_ve?: number | string | null;
  tong_xac?: number | string | null;
  tong_trung?: number | string | null;
  lai_lo?: number | string | null;
};

const REGION_LABELS: Record<Region, string> = {
  nam: 'Miền Nam',
  trung: 'Miền Trung',
  bac: 'Miền Bắc',
};

export function regionConfig(region: Region, date: string) {
  const cfg = getConfig(region);
  return {
    region,
    regionName: cfg.name,
    daiList: cfg.daiList,
    prizeRows: cfg.prizeRows,
    heSoXacDefault: cfg.heSoXacDefault,
    tyLeDefault: cfg.tyLeDefault,
    activeDai: getActiveDai(region, parseWorkDate(date)),
    resultSourceUrl: resultSourceUrl(region, date),
    resultSourceUrls: resultSourceUrls(region, date),
  };
}

export function summaryConfig(region: RegionScope, date: string) {
  if (region === 'all') {
    return {
      region,
      regionName: 'Cả ngày',
      activeDai: [],
    };
  }
  const cfg = getConfig(region);
  return {
    region,
    regionName: cfg.name,
    activeDai: getActiveDai(region, parseWorkDate(date)),
  };
}

export function attachTicketSourceLines<TTicket extends TicketLike & { source_line_no?: number | null }>(
  tickets: TTicket[],
  messages: MessageLike[],
) {
  const messageCache = new Map<string, { raw: string; normalizedLines: string[] }>();
  for (const message of messages) {
    const raw = message.raw_text || '';
    const normalizedLines = raw.split(/\r?\n/).map(normalizeTicketLine);
    messageCache.set(message.id, { raw, normalizedLines });
  }

  return tickets.map(ticket => {
    if (typeof ticket.source_line_no === 'number') return ticket;
    const msgId = (ticket as TicketLike & { ticket_message_id?: string }).ticket_message_id || '';
    const cached = messageCache.get(msgId);
    if (!cached || !ticket.source_text) {
      return { ...ticket, source_line_no: null };
    }
    const source = normalizeTicketLine(ticket.source_text);
    if (!source) return { ...ticket, source_line_no: null };

    const index = cached.normalizedLines.findIndex(current => {
      if (!current) return false;
      return current === source || current.includes(source) || source.includes(current);
    });

    return {
      ...ticket,
      source_line_no: index >= 0 ? index + 1 : null,
    };
  });
}

export function summarizeTickets(tickets: TicketLike[]): TicketTotals {
  const total = tickets.length;
  let checked = 0;
  let hitCount = 0;
  let xac = 0;
  let win = 0;

  for (let i = 0; i < total; i++) {
    const ticket = tickets[i];
    if (isChecked(ticket)) checked++;
    if (isHit(ticket)) hitCount++;
    xac += numberValue(ticket.xac);
    win += numberValue(ticket.tien_thang);
  }

  return {
    tickets: total,
    checked,
    hitCount,
    xac,
    win,
    net: win - xac,
    averageXac: total ? xac / total : 0,
    checkedRate: total ? Math.round((checked / total) * 100) : 0,
    hitRate: checked ? Math.round((hitCount / checked) * 100) : 0,
    payoutRate: xac ? Math.round((win / xac) * 100) : 0,
  };
}

export function groupByPlayer(tickets: TicketLike[]) {
  const rows = new Map<string, PlayerSummaryRow>();
  for (const ticket of tickets) {
    const key = ticket.player_id || ticket.player_name || 'Khach';
    const row = rows.get(key) || {
      playerId: ticket.player_id || null,
      playerName: ticket.player_name || 'Khach',
      soVe: 0,
      tongXac: 0,
      tongTrung: 0,
      laiLo: 0,
    };
    row.soVe += 1;
    row.tongXac += numberValue(ticket.xac);
    row.tongTrung += numberValue(ticket.tien_thang);
    row.laiLo = row.tongTrung - row.tongXac;
    rows.set(key, row);
  }
  return [...rows.values()].sort((a, b) => Math.abs(b.laiLo) - Math.abs(a.laiLo));
}

export function playerSummaryFromDaily(rows: DailySummaryLike[]) {
  const grouped = new Map<string, PlayerSummaryRow>();
  for (const item of rows) {
    const key = item.player_name || 'Khach';
    const row = grouped.get(key) || {
      playerId: null,
      playerName: item.player_name || 'Khach',
      soVe: 0,
      tongXac: 0,
      tongTrung: 0,
      laiLo: 0,
    };
    row.soVe += numberValue(item.so_ve);
    row.tongXac += numberValue(item.tong_xac);
    row.tongTrung += numberValue(item.tong_trung);
    row.laiLo = row.tongTrung - row.tongXac;
    grouped.set(key, row);
  }
  return [...grouped.values()].sort((a, b) => Math.abs(b.laiLo) - Math.abs(a.laiLo));
}

export function totalsFromPlayerSummary(rows: PlayerSummaryRow[], ticketStats: TicketLike[] | TicketStatCounts = []) {
  const tickets = rows.reduce((sum, row) => sum + numberValue(row.soVe), 0);
  const xac = rows.reduce((sum, row) => sum + numberValue(row.tongXac), 0);
  const win = rows.reduce((sum, row) => sum + numberValue(row.tongTrung), 0);
  const stats = Array.isArray(ticketStats) ? summarizeTickets(ticketStats) : ticketStats;
  const checked = stats.checked || 0;
  const hitCount = stats.hitCount || 0;
  return {
    tickets,
    checked,
    hitCount,
    xac,
    win,
    net: win - xac,
    averageXac: tickets ? xac / tickets : 0,
    checkedRate: tickets ? Math.round((checked / tickets) * 100) : 0,
    hitRate: checked ? Math.round((hitCount / checked) * 100) : 0,
    payoutRate: xac ? Math.round((win / xac) * 100) : 0,
  };
}

export function groupDailyByRegion(rows: DailySummaryLike[]) {
  const grouped = new Map<string, MetricRow>();
  for (const item of rows) {
    const label = item.region ? REGION_LABELS[item.region] || item.region : 'Chưa rõ';
    const row = grouped.get(label) || { label, count: 0, xac: 0, win: 0, net: 0 };
    row.count += numberValue(item.so_ve);
    row.xac += numberValue(item.tong_xac);
    row.win += numberValue(item.tong_trung);
    row.net = row.win - row.xac;
    grouped.set(label, row);
  }
  return sortMetricRows(grouped);
}

export function groupByDai(tickets: TicketLike[]) {
  const rows = new Map<string, MetricRow>();
  for (const ticket of tickets) {
    const dais = ticket.dai?.length ? ticket.dai : ['Chưa rõ'];
    const share = 1 / dais.length;
    for (const dai of dais) addMetric(rows, dai, ticket, share);
  }
  return sortMetricRows(rows);
}

export function groupByRegion(tickets: TicketLike[]) {
  const rows = new Map<string, MetricRow>();
  for (const ticket of tickets) {
    const label = ticket.region ? REGION_LABELS[ticket.region] || ticket.region : 'Chưa rõ';
    addMetric(rows, label, ticket);
  }
  return sortMetricRows(rows);
}

export function groupByStatus(tickets: TicketLike[]) {
  const rows = new Map<string, MetricRow>();
  for (const ticket of tickets) addMetric(rows, statusLabel(ticket), ticket);
  return sortMetricRows(rows);
}

export function groupByType(tickets: TicketLike[]) {
  const rows = new Map<string, MetricRow>();
  for (const ticket of tickets) addMetric(rows, ticket.loai_label || ticket.loai || 'Chưa rõ', ticket);
  return sortMetricRows(rows);
}

export function filterTicketsByPlayer<TTicket extends TicketLike>(
  tickets: TTicket[],
  players: Array<{ id: string; name: string }>,
  playerId?: string | null,
) {
  if (!playerId) return tickets;
  const player = players.find(item => item.id === playerId);
  return tickets.filter(ticket => ticket.player_id === playerId || (!ticket.player_id && player && ticket.player_name === player.name));
}

export type PlayerScope = {
  playerId?: string;
  playerName?: string;
};

export function resolvePlayerScope(
  players: Array<{ id: string; name: string }>,
  playerId?: string | null,
): PlayerScope {
  if (!playerId) return {};
  const player = players.find(item => item.id === playerId);
  return { playerId, playerName: player?.name };
}

export function applyTicketPlayerFilter(query: any, scope: PlayerScope) {
  if (!scope.playerId) return query;
  if (scope.playerName) {
    return query.or(`player_id.eq.${scope.playerId},and(player_id.is.null,player_name.eq.${quotePostgrestValue(scope.playerName)})`);
  }
  return query.eq('player_id', scope.playerId);
}

export type TicketStatCounts = {
  checked: number;
  hitCount: number;
};

export async function fetchTicketStatCounts(
  supabase: { from: (table: string) => any },
  ownerId: string,
  date: string,
  region: RegionScope,
  scope: PlayerScope = {},
): Promise<TicketStatCounts> {
  let checkedQuery = supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
    .eq('message_date', date)
    .or('tien_thang.gt.0,and(status.neq.Chua co KQ,status.neq.?)');

  let hitQuery = supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
    .eq('message_date', date)
    .or('status.eq.TRUNG,tien_thang.gt.0');

  if (region !== 'all') {
    checkedQuery = checkedQuery.eq('region', region);
    hitQuery = hitQuery.eq('region', region);
  }

  checkedQuery = applyTicketPlayerFilter(checkedQuery, scope);
  hitQuery = applyTicketPlayerFilter(hitQuery, scope);

  const [checkedResult, hitResult] = await Promise.all([checkedQuery, hitQuery]);
  if (checkedResult.error) throw checkedResult.error;
  if (hitResult.error) throw hitResult.error;

  return {
    checked: checkedResult.count || 0,
    hitCount: hitResult.count || 0,
  };
}

export function computeSourceLineNo(sourceText: string, rawText: string) {
  return ticketSourceLine({ source_text: sourceText }, rawText);
}

function addMetric(rows: Map<string, MetricRow>, label: string, ticket: TicketLike, share = 1) {
  const row = rows.get(label) || { label, count: 0, xac: 0, win: 0, net: 0 };
  row.count += 1;
  row.xac += numberValue(ticket.xac) * share;
  row.win += numberValue(ticket.tien_thang) * share;
  row.net = row.win - row.xac;
  rows.set(label, row);
}

function sortMetricRows(rows: Map<string, MetricRow>) {
  return [...rows.values()].sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}

function isChecked(ticket: TicketLike) {
  return numberValue(ticket.tien_thang) > 0 || (ticket.status !== 'Chua co KQ' && ticket.status !== '?');
}

function isHit(ticket: TicketLike) {
  return ticket.status === 'TRUNG' || numberValue(ticket.tien_thang) > 0;
}

function statusLabel(ticket: TicketLike) {
  if (isHit(ticket)) return 'Trúng';
  if (ticket.status === 'Truot') return 'Trượt';
  return 'Chưa có KQ';
}

function ticketSourceLine(ticket: TicketLike, rawText: string) {
  if (!rawText || !ticket.source_text) return null;
  const source = normalizeTicketLine(ticket.source_text);
  if (!source) return null;
  const lines = rawText.split(/\r?\n/);
  const index = lines.findIndex(line => {
    const current = normalizeTicketLine(line);
    if (!current) return false;
    return current === source || current.includes(source) || source.includes(current);
  });
  return index >= 0 ? index + 1 : null;
}

function normalizeTicketLine(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function numberValue(value: unknown) {
  return Number(value || 0);
}

function quotePostgrestValue(value: string) {
  return `"${String(value).replace(/"/g, '""')}"`;
}
