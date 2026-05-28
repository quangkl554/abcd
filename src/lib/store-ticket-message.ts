import { issueDraftsFromWarnings } from './issues';
import { canonicalRegion, parseEnvelope, type Region } from './core';
import { parseWorkDate } from './dates';
import { serializeTicket } from './tickets';

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

  const ticketRows = (parsed.tickets || []).map(ticket => serializeTicket(ticket, {
    ownerId: args.ownerId,
    messageId: message.id,
    date: args.date,
    playerId,
  }));

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

  if (args.issueId) {
    const { data: issue, error: issueFindError } = await args.supabase
      .from('parse_issues')
      .select('source_text')
      .eq('owner_id', args.ownerId)
      .eq('ticket_message_id', args.messageId)
      .eq('id', args.issueId)
      .maybeSingle();
    if (issueFindError) throw issueFindError;
    if (issue?.source_text) replacedSourceTexts.add(issue.source_text);
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

  let issueUpdate = args.supabase
    .from('parse_issues')
    .update({ status: 'resolved', corrected_text: args.correctedText, resolved_at: new Date().toISOString() })
    .eq('owner_id', args.ownerId)
    .eq('ticket_message_id', args.messageId)
    .eq('status', 'open');
  if (args.issueId) issueUpdate = issueUpdate.eq('id', args.issueId);
  const { error: issueUpdateError } = await issueUpdate;
  if (issueUpdateError) throw issueUpdateError;

  const nextRawText = mode === 'append'
    ? appendCorrectionText(message.raw_text || '', args.correctedText)
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

  let ticketRows = (parsed.tickets || []).map(ticket => serializeTicket(ticket, {
    ownerId: args.ownerId,
    messageId: args.messageId,
    date: message.message_date,
    playerId,
  }));

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

function appendCorrectionText(rawText: string, correctedText: string) {
  const trimmedRaw = rawText.trim();
  const trimmedCorrection = correctedText.trim();
  if (!trimmedRaw) return trimmedCorrection;
  if (trimmedRaw.includes(trimmedCorrection)) return trimmedRaw;
  return `${trimmedRaw}\n${trimmedCorrection}`;
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
  return JSON.stringify({
    loai: ticket.loai || '',
    dai: [...(ticket.dai || [])].sort(),
    so_list: ticket.so_list || [],
    tien_dat: Number(ticket.tien_dat || 0),
    source_text: ticket.source_text || '',
  });
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
