import { issueDraftsFromWarnings } from './issues';
import { canonicalRegion, parseEnvelope, type Region } from './core';
import { parseWorkDate } from './dates';
import { serializeTicket } from './tickets';
import { computeSourceLineNo } from './workspace-server';

type SupabaseLike = any;

export async function parseAndStoreTicketMessage(args: {
  supabase: SupabaseLike;
  ownerId: string;
  date: string;
  region: Region;
  text: string;
  playerId?: string | null;
}) {
  const selectedPlayer = args.playerId ? await findPlayer(args.supabase, args.ownerId, args.playerId) : null;
  const parsed = parseEnvelope({
    text: args.text,
    region: canonicalRegion(args.region),
    date: parseWorkDate(args.date),
    fallbackPlayer: selectedPlayer?.name || null,
    rates: selectedPlayer?.rate_profile || null,
  });

  const playerName = parsed.playerName || selectedPlayer?.name || null;
  const player = playerName ? await upsertPlayer(args.supabase, args.ownerId, playerName, selectedPlayer?.rate_profile) : selectedPlayer;
  const playerId = player?.id || selectedPlayer?.id || null;

  const { data: message, error: messageError } = await args.supabase
    .from('ticket_messages')
    .insert({
      owner_id: args.ownerId,
      message_date: args.date,
      region: canonicalRegion(parsed.region || args.region),
      player_id: playerId,
      player_name: playerName,
      raw_text: args.text,
      parse_json: parsed,
      warnings: parsed.warnings || [],
    })
    .select('*')
    .single();
  if (messageError) throw messageError;

  // Pre-split the message text for fast source line calculation
  const textLines = args.text.split(/\r?\n/).map(line => line.replace(/\s+/g, ' ').trim().toLowerCase());
  const ticketRows = (parsed.tickets || []).map(ticket => {
    const source = (ticket.sourceText || '').replace(/\s+/g, ' ').trim().toLowerCase();
    let sourceLineNo: number | null = null;
    if (source) {
      const idx = textLines.findIndex(line => line === source || line.includes(source) || source.includes(line));
      if (idx >= 0) sourceLineNo = idx + 1;
    }
    return serializeTicket(ticket, {
      ownerId: args.ownerId,
      messageId: message.id,
      date: args.date,
      playerId,
      sourceLineNo,
    });
  });

  let tickets: any[] = [];
  if (ticketRows.length) {
    const { data, error } = await args.supabase.from('tickets').insert(ticketRows).select('*');
    if (error) throw error;
    tickets = data || [];
  }

  const issueRows = issueDraftsFromWarnings({
    warnings: parsed.warnings || [],
    rawText: args.text,
    date: args.date,
    region: args.region,
  }).map(issue => ({ ...issue, owner_id: args.ownerId, ticket_message_id: message.id }));

  let issues: any[] = [];
  if (issueRows.length) {
    const { data, error } = await args.supabase.from('parse_issues').insert(issueRows).select('*');
    if (error) throw error;
    issues = data || [];
  }

  return { parsed, message, tickets, issues };
}

export async function reparseTicketMessage(args: {
  supabase: SupabaseLike;
  ownerId: string;
  messageId: string;
  correctedText: string;
  issueId?: string;
  sourceText?: string;
  mode?: 'append' | 'replace';
}) {
  const { data: message, error: findError } = await args.supabase
    .from('ticket_messages')
    .select('*')
    .eq('owner_id', args.ownerId)
    .eq('id', args.messageId)
    .single();
  if (findError) throw findError;

  const selectedPlayer = message.player_id ? await findPlayer(args.supabase, args.ownerId, message.player_id) : null;
  const parsed = parseEnvelope({
    text: args.correctedText,
    region: message.region,
    date: parseWorkDate(message.message_date),
    fallbackPlayer: message.player_name || selectedPlayer?.name || null,
    rates: selectedPlayer?.rate_profile || null,
  });

  const playerName = parsed.playerName || message.player_name || selectedPlayer?.name || null;
  const player = playerName ? await upsertPlayer(args.supabase, args.ownerId, playerName, selectedPlayer?.rate_profile) : selectedPlayer;
  const playerId = player?.id || selectedPlayer?.id || null;
  const replacedSourceTexts = new Set<string>();
  let issueSourceText = '';
  const sourceText = args.sourceText?.trim() || '';
  if (sourceText) replacedSourceTexts.add(sourceText);

  if (args.issueId) {
    const { data: issue, error: issueFindError } = await args.supabase
      .from('parse_issues')
      .select('source_text')
      .eq('owner_id', args.ownerId)
      .eq('ticket_message_id', args.messageId)
      .eq('id', args.issueId)
      .maybeSingle();
    if (issueFindError) throw issueFindError;
    if (issue?.source_text) {
      issueSourceText = issue.source_text;
      replacedSourceTexts.add(issue.source_text);
    }
  }

  const mode = args.mode || 'append';
  if (mode === 'replace') {
    const { error: deleteTicketsError } = await args.supabase
      .from('tickets')
      .delete()
      .eq('owner_id', args.ownerId)
      .eq('ticket_message_id', args.messageId);
    if (deleteTicketsError) throw deleteTicketsError;
  }

  const issueFilterSource = issueSourceText || sourceText;
  if (args.issueId || issueFilterSource) {
    let issueUpdate = args.supabase
      .from('parse_issues')
      .update({ status: 'resolved', corrected_text: args.correctedText, resolved_at: new Date().toISOString() })
      .eq('owner_id', args.ownerId)
      .eq('ticket_message_id', args.messageId)
      .eq('status', 'open');
    if (issueFilterSource) issueUpdate = issueUpdate.eq('source_text', issueFilterSource);
    else if (args.issueId) issueUpdate = issueUpdate.eq('id', args.issueId);
    const { error: issueUpdateError } = await issueUpdate;
    if (issueUpdateError) throw issueUpdateError;
  }

  const replacementSourceText = issueSourceText || sourceText;
  const nextRawText = mode === 'append'
    ? replacementSourceText
      ? replaceSourceLineText(message.raw_text || '', replacementSourceText, args.correctedText)
      : appendCorrectionText(message.raw_text || '', args.correctedText)
    : args.correctedText;

  const { data: updated, error: updateError } = await args.supabase
    .from('ticket_messages')
    .update({
      raw_text: nextRawText,
      parse_json: parsed,
      warnings: parsed.warnings || [],
      player_id: playerId,
      player_name: playerName,
    })
    .eq('owner_id', args.ownerId)
    .eq('id', args.messageId)
    .select('*')
    .single();
  if (updateError) throw updateError;

  const nextRawTextLines = nextRawText.split(/\r?\n/).map(line => line.replace(/\s+/g, ' ').trim().toLowerCase());
  let ticketRows = (parsed.tickets || []).map(ticket => {
    const source = (ticket.sourceText || '').replace(/\s+/g, ' ').trim().toLowerCase();
    let sourceLineNo: number | null = null;
    if (source) {
      const idx = nextRawTextLines.findIndex(line => line === source || line.includes(source) || source.includes(line));
      if (idx >= 0) sourceLineNo = idx + 1;
    }
    return serializeTicket(ticket, {
      ownerId: args.ownerId,
      messageId: args.messageId,
      date: message.message_date,
      playerId,
      sourceLineNo,
    });
  });

  if (mode === 'append' && replacedSourceTexts.size) {
    await deleteTicketsBySourceText(args.supabase, args.ownerId, args.messageId, replacedSourceTexts);
  }

  if (mode === 'append' && ticketRows.length) {
    ticketRows = await removeExistingTicketRows(args.supabase, args.ownerId, args.messageId, ticketRows);
  }

  let tickets: any[] = [];
  if (ticketRows.length) {
    const { data, error } = await args.supabase.from('tickets').insert(ticketRows).select('*');
    if (error) throw error;
    tickets = data || [];
  }

  const issueRows = issueDraftsFromWarnings({
    warnings: parsed.warnings || [],
    rawText: args.correctedText,
    date: message.message_date,
    region: message.region,
  }).map(issue => ({ ...issue, owner_id: args.ownerId, ticket_message_id: args.messageId }));

  let issues: any[] = [];
  if (issueRows.length) {
    const { data, error } = await args.supabase.from('parse_issues').insert(issueRows).select('*');
    if (error) throw error;
    issues = data || [];
  }

  return { parsed, message: updated, tickets, issues };
}

export async function deleteTicketMessageScope(args: {
  supabase: SupabaseLike;
  ownerId: string;
  messageId: string;
  ticketId?: string;
  sourceText?: string;
  sourceLineNo?: number | null;
  playerId?: string | null;
  playerName?: string | null;
  region?: string | null;
}) {
  const sourceText = args.sourceText?.trim() || '';
  const sourceLineNo = typeof args.sourceLineNo === 'number' ? args.sourceLineNo : null;

  let deletedTickets = await deleteTicketsByScope(args.supabase, {
    ownerId: args.ownerId,
    messageId: args.messageId,
    ticketId: args.ticketId,
    sourceText,
    sourceLineNo,
    playerId: args.playerId,
    playerName: args.playerName,
    region: args.region,
    preferSourceLine: sourceLineNo != null,
  });

  if (!deletedTickets.length && sourceText && sourceLineNo != null) {
    deletedTickets = await deleteTicketsByScope(args.supabase, {
      ownerId: args.ownerId,
      messageId: args.messageId,
      ticketId: args.ticketId,
      sourceText,
      sourceLineNo: null,
      playerId: args.playerId,
      playerName: args.playerName,
      region: args.region,
      preferSourceLine: false,
    });
  }

  if (sourceLineNo != null || sourceText) {
    await ignoreIssuesByScope(args.supabase, args.ownerId, args.messageId, sourceLineNo, sourceText);
  }

  return { deletedTickets, deletedCount: deletedTickets.length };
}

function appendCorrectionText(rawText: string, correctedText: string) {
  const trimmedRaw = rawText.trim();
  const trimmedCorrection = correctedText.trim();
  if (!trimmedRaw) return trimmedCorrection;
  if (trimmedRaw.includes(trimmedCorrection)) return trimmedRaw;
  return `${trimmedRaw}\n${trimmedCorrection}`;
}

function replaceSourceLineText(rawText: string, sourceText: string, correctedText: string) {
  const source = normalizeLine(sourceText);
  const correction = correctedText.trim();
  if (!source) return appendCorrectionText(rawText, correctedText);
  const lines = String(rawText || '').split(/\r?\n/);
  const index = lines.findIndex(line => normalizeLine(line) === source);
  if (index < 0) return appendCorrectionText(rawText, correctedText);
  lines.splice(index, 1, ...correction.split(/\r?\n/));
  return lines.join('\n').trim();
}

function normalizeLine(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

async function deleteTicketsBySourceText(supabase: SupabaseLike, ownerId: string, messageId: string, sourceTexts: Set<string>) {
  const values = [...sourceTexts].map(text => text.trim()).filter(Boolean);
  if (!values.length) return;
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('owner_id', ownerId)
    .eq('ticket_message_id', messageId)
    .in('source_text', values);
  if (error) throw error;
}

async function deleteTicketsByScope(
  supabase: SupabaseLike,
  scope: {
    ownerId: string;
    messageId: string;
    ticketId?: string;
    sourceText?: string;
    sourceLineNo?: number | null;
    playerId?: string | null;
    playerName?: string | null;
    region?: string | null;
    preferSourceLine?: boolean;
  },
) {
  let query = supabase
    .from('tickets')
    .delete()
    .eq('owner_id', scope.ownerId)
    .eq('ticket_message_id', scope.messageId);

  if (scope.region) query = query.eq('region', scope.region);
  if (scope.playerId) query = query.eq('player_id', scope.playerId);
  else if (scope.playerName) query = query.eq('player_name', scope.playerName);

  if (scope.preferSourceLine && scope.sourceLineNo != null) {
    query = query.eq('source_line_no', scope.sourceLineNo);
  } else if (scope.sourceText) {
    query = query.eq('source_text', scope.sourceText);
  } else if (scope.ticketId) {
    query = query.eq('id', scope.ticketId);
  } else {
    return [];
  }

  const { data, error } = await query.select('id,source_text,source_line_no');
  if (error) throw error;
  return data || [];
}

async function ignoreIssuesByScope(
  supabase: SupabaseLike,
  ownerId: string,
  messageId: string,
  sourceLineNo: number | null,
  sourceText: string,
) {
  let query = supabase
    .from('parse_issues')
    .update({ status: 'ignored', resolved_at: new Date().toISOString() })
    .eq('owner_id', ownerId)
    .eq('ticket_message_id', messageId)
    .eq('status', 'open');

  if (sourceLineNo != null) query = query.eq('line_no', sourceLineNo);
  else if (sourceText) query = query.eq('source_text', sourceText);
  else return;

  const { error } = await query;
  if (error) throw error;
}

async function removeExistingTicketRows(supabase: SupabaseLike, ownerId: string, messageId: string, ticketRows: any[]) {
  const { data, error } = await supabase
    .from('tickets')
    .select('loai,dai,so_list,tien_dat,source_text')
    .eq('owner_id', ownerId)
    .eq('ticket_message_id', messageId);
  if (error) throw error;
  const existing = new Set((data || []).map(ticketFingerprint));
  return ticketRows.filter(row => !existing.has(ticketFingerprint(row)));
}

function ticketFingerprint(ticket: any) {
  const sortedDai = Array.isArray(ticket.dai) ? [...ticket.dai].sort().join(',') : '';
  const soList = Array.isArray(ticket.so_list) ? ticket.so_list.join(',') : '';
  return `${ticket.loai || ''}|${sortedDai}|${soList}|${Number(ticket.tien_dat || 0)}|${ticket.source_text || ''}`;
}

async function findPlayer(supabase: SupabaseLike, ownerId: string, playerId: string) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('id', playerId)
    .single();
  if (error) throw error;
  return data;
}

async function upsertPlayer(supabase: SupabaseLike, ownerId: string, name: string, rateProfile?: unknown) {
  const existing = await supabase
    .from('players')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('name', name)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    if (existing.data.active) return existing.data;
    const { data, error } = await supabase
      .from('players')
      .update({ active: true })
      .eq('owner_id', ownerId)
      .eq('id', existing.data.id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('players')
    .insert({
      owner_id: ownerId,
      name,
      rate_profile: rateProfile || { heSoXac: {}, tyLe: {} },
      active: true,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
