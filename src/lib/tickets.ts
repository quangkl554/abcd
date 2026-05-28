import type { ParsedTicket } from './core';

export function serializeTicket(ticket: ParsedTicket, context: {
  ownerId: string;
  messageId: string;
  date: string;
  playerId: string | null;
  sourceLineNo?: number | null;
}) {
  return {
    owner_id: context.ownerId,
    ticket_message_id: context.messageId,
    message_date: context.date,
    player_id: context.playerId,
    player_name: ticket.playerName || 'Khach',
    region: ticket.region,
    dai: ticket.dai || [],
    loai: ticket.loai,
    loai_label: ticket.loaiLabel || ticket.loai,
    so_list: ticket.soList || [],
    tien_dat: ticket.tienDat || 0,
    chan: ticket.chan || 0,
    so_giai: ticket.soGiai || 0,
    he_so_xac: ticket.heSoXac || 0,
    ty_le_trung: ticket.tyLeTrung || 0,
    xac: ticket.xac || 0,
    source_text: ticket.sourceText || '',
    source_line_no: context.sourceLineNo ?? null,
    status: mapStatus(ticket.ketQua || '?'),
    tien_thang: ticket.tienThang || 0,
    ghi_chu: ticket.ghiChu || '',
    hits: ticket.hits || [],
  };
}

export function dbTicketToCore(ticket: Record<string, any>): ParsedTicket {
  return {
    id: ticket.id,
    playerName: ticket.player_name,
    region: ticket.region,
    dai: ticket.dai || [],
    loai: ticket.loai,
    loaiLabel: ticket.loai_label,
    soList: ticket.so_list || [],
    tienDat: Number(ticket.tien_dat || 0),
    chan: Number(ticket.chan || 0),
    soGiai: Number(ticket.so_giai || 0),
    heSoXac: Number(ticket.he_so_xac || 0),
    tyLeTrung: Number(ticket.ty_le_trung || 0),
    xac: Number(ticket.xac || 0),
    sourceText: ticket.source_text || '',
    ketQua: ticket.status === 'Truot' ? 'Trượt' : ticket.status,
    tienThang: Number(ticket.tien_thang || 0),
    ghiChu: ticket.ghi_chu || '',
    hits: ticket.hits || [],
  };
}

export function mapStatus(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized === 'trung') return 'TRUNG';
  if (normalized === 'truot') return 'Truot';
  if (normalized === 'chua co kq') return 'Chua co KQ';
  return '?';
}

function normalizeStatus(status: string) {
  return String(status || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
