'use client';

import Link from 'next/link';
import { memo, useEffect, useMemo, useState, useTransition, useCallback } from 'react';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Edit3,
  ListChecks,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  UserRound,
  XCircle,
} from 'lucide-react';
import { useWorkspaceData } from '@/lib/use-workspace-data';
import { ActionDialog } from './action-dialog';
import { AppHeader } from './app-header';
import { WorkDatePicker } from './work-date-picker';

type Region = 'nam' | 'trung' | 'bac';

type Player = {
  id: string;
  name: string;
  active: boolean;
  rate_profile: { heSoXac?: Record<string, number>; tyLe?: Record<string, number> };
};

type Ticket = {
  id: string;
  ticket_message_id: string;
  player_id: string | null;
  player_name: string;
  dai: string[];
  loai: string;
  loai_label: string;
  so_list: string[];
  tien_dat: number;
  xac: number;
  status: string;
  tien_thang: number;
  ghi_chu: string;
  source_text: string;
  source_line_no?: number | null;
  created_at?: string;
};

type ParseIssue = {
  id: string;
  ticket_message_id: string;
  status: 'open' | 'resolved' | 'ignored';
  warning: string;
  line_no: number | null;
  source_text: string | null;
};

type TicketMessage = {
  id: string;
  created_at: string;
  player_id: string | null;
  player_name: string | null;
  raw_text?: string;
};

type Workspace = {
  profile: { username: string; role: 'admin' | 'user' };
  config: {
    region: Region;
    regionName: string;
    daiList: string[];
    prizeRows: Array<{ name: string; count: number; ndigits: number; key: string }>;
    heSoXacDefault: Record<string, number>;
    tyLeDefault: Record<string, number>;
    activeDai: string[];
    resultSourceUrl: string;
  };
  players: Player[];
  messages: TicketMessage[];
  tickets: Ticket[];
  issues: ParseIssue[];
  summary: Array<{ playerId: string | null; playerName: string; soVe: number; tongXac: number; tongTrung: number; laiLo: number }>;
};

type EditingLine = {
  key: string;
  messageId: string;
  sourceText: string;
  sourceLineNumber: number | null;
};

type DashboardDialog =
  | { type: 'delete-player'; playerId: string; playerName: string }
  | { type: 'delete-ticket-line'; messageId: string; ticketId: string; sourceText: string; sourceLineNumber: number | null; playerId: string | null; playerName: string }
  | { type: 'reset'; scope: 'day-region' | 'all'; label: string };

const REGIONS: Array<{ id: Region; label: string; short: string }> = [
  { id: 'nam', label: 'Miền Nam', short: 'Nam' },
  { id: 'trung', label: 'Miền Trung', short: 'Trung' },
  { id: 'bac', label: 'Miền Bắc', short: 'Bắc' },
];

const RATE_LABELS: Record<string, string> = {
  Lo: 'Lô',
  Dau: 'Đầu',
  Duoi: 'Đuôi',
  DauDuoi: 'Đầu đuôi',
  XiuChu: 'Xỉu chủ',
  XiuChuDau: 'Xỉu chủ đầu',
  XiuChuDuoi: 'Xỉu chủ đuôi',
  '3Cang': '3 càng',
  '4Cang': '4 càng',
};

export function Dashboard() {
  const [date, setDate] = useState(todayKey());
  const [region, setRegion] = useState<Region>('nam');
  const { workspace, loading, error, setError, loadWorkspace } = useWorkspaceData<Workspace>(date, region, { endpoint: 'app' });
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [playerSelectionTouched, setPlayerSelectionTouched] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [ticketText, setTicketText] = useState('');
  const [issueDrafts, setIssueDrafts] = useState<Record<string, string>>({});
  const [editingLine, setEditingLine] = useState<EditingLine | null>(null);
  const [editingText, setEditingText] = useState('');
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState<DashboardDialog | null>(null);
  const [dialogConfirm, setDialogConfirm] = useState('');
  const [pending, startTransition] = useTransition();

  const activePlayer = workspace?.players.find(player => player.id === selectedPlayerId) || null;
  const filteredMessages = useMemo(() => {
    const messages = workspace?.messages || [];
    if (!selectedPlayerId || !activePlayer) return messages;
    return messages.filter(message => message.player_id === selectedPlayerId || (!message.player_id && message.player_name === activePlayer.name));
  }, [activePlayer, selectedPlayerId, workspace?.messages]);
  const messageOrder = useMemo(() => {
    const map = new Map<string, number>();
    [...filteredMessages]
      .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
      .forEach((message, index) => map.set(message.id, index + 1));
    return map;
  }, [filteredMessages]);
  const filteredTickets = useMemo(() => {
    const tickets = workspace?.tickets || [];
    if (!selectedPlayerId || !activePlayer) return tickets;
    return tickets.filter(ticket => ticket.player_id === selectedPlayerId || (!ticket.player_id && ticket.player_name === activePlayer.name));
  }, [activePlayer, selectedPlayerId, workspace?.tickets]);
  const sortedTickets = useMemo(() => {
    return [...filteredTickets].sort((a, b) => {
      const messageDiff = (messageOrder.get(a.ticket_message_id) || 0) - (messageOrder.get(b.ticket_message_id) || 0);
      if (messageDiff) return messageDiff;
      const lineA = ticketSourceLine(a, filteredMessages) ?? Number.MAX_SAFE_INTEGER;
      const lineB = ticketSourceLine(b, filteredMessages) ?? Number.MAX_SAFE_INTEGER;
      if (lineA !== lineB) return lineA - lineB;
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });
  }, [filteredMessages, filteredTickets, messageOrder]);
  const filteredMessageIds = useMemo(() => new Set(filteredMessages.map(message => message.id)), [filteredMessages]);
  const filteredIssues = useMemo(() => {
    const issues = workspace?.issues || [];
    if (!selectedPlayerId) return issues;
    return issues.filter(issue => filteredMessageIds.has(issue.ticket_message_id));
  }, [filteredMessageIds, selectedPlayerId, workspace?.issues]);
  const activeIssues = useMemo(() => groupOpenIssues(filteredIssues), [filteredIssues]);
  const totals = useMemo(() => {
    return {
      tickets: filteredTickets.length,
      xac: filteredTickets.reduce((sum, ticket) => sum + Number(ticket.xac || 0), 0),
      win: filteredTickets.reduce((sum, ticket) => sum + Number(ticket.tien_thang || 0), 0),
    };
  }, [filteredTickets]);

  useEffect(() => {
    if (!workspace) return;
    const players = workspace.players || [];
    if (!players.length) {
      if (selectedPlayerId) setSelectedPlayerId('');
      return;
    }

    if (selectedPlayerId) {
      if (!players.some(player => player.id === selectedPlayerId)) {
        setSelectedPlayerId(players[0].id);
      }
      return;
    }

    if (!playerSelectionTouched) {
      setSelectedPlayerId(players[0].id);
    }
  }, [playerSelectionTouched, selectedPlayerId, workspace]);

  const choosePlayer = useCallback((playerId: string) => {
    setPlayerSelectionTouched(true);
    setSelectedPlayerId(playerId);
  }, []);

  function submitTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('Đang đọc tin...');
    setError('');
    startTransition(async () => {
      const response = await apiPost('/api/ticket-messages', {
        date,
        region,
        playerId: selectedPlayerId || null,
        text: ticketText,
      });
      if (!response.ok) return setError(response.error);
      const issueCount = response.issues?.length || 0;
      setNotice(issueCount ? `Đã lưu phần đọc được, còn ${issueCount} tin cần sửa.` : 'Đã thêm tin.');
      setTicketText('');
      await loadWorkspace({ force: true });
    });
  }

  function createPlayer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newPlayerName.trim()) return;
    startTransition(async () => {
      const response = await apiPost('/api/players', { name: newPlayerName.trim() });
      if (!response.ok) return setError(response.error);
      setNewPlayerName('');
      setPlayerSelectionTouched(true);
      setSelectedPlayerId(response.player.id);
      await loadWorkspace({ force: true });
    });
  }

  async function saveRates(rateProfile: Player['rate_profile']) {
    if (!activePlayer) return;
    const response = await apiPatch('/api/players', { id: activePlayer.id, rateProfile, recalculate: { date, region } });
    if (!response.ok) return setError(response.error);
    setNotice(response.recalculatedTickets
      ? `Đã lưu hệ số và cập nhật ${response.recalculatedTickets} vé của khách trong ngày/miền này.`
      : 'Đã lưu hệ số và tỉ lệ cho khách.');
    await loadWorkspace({ force: true });
  }

  async function deletePlayer() {
    if (!activePlayer) return;
    setDialog({ type: 'delete-player', playerId: activePlayer.id, playerName: activePlayer.name });
  }

  async function reparseIssue(issue: ParseIssue) {
    const correctedText = (issueDrafts[issue.id] || issue.source_text || '').trim();
    if (!correctedText) return setError('Tin sửa không được trống.');
    setNotice('Đang sửa lại và thay dữ liệu...');
    const response = await apiPost(`/api/ticket-messages/${issue.ticket_message_id}/reparse`, {
      correctedText,
      issueId: issue.id,
      sourceText: issue.source_text || undefined,
      mode: 'append',
    });
    if (!response.ok) return setError(response.error);
    setIssueDrafts(current => {
      const next = { ...current };
      delete next[issue.id];
      return next;
    });
    setNotice(response.issues?.length ? `Đã thay phần parse được, còn ${response.issues.length} tin cần sửa.` : 'OK, đã thay dữ liệu sửa và đóng hộp tin cần sửa.');
    await loadWorkspace({ force: true });
  }

  async function ignoreIssue(issue: ParseIssue) {
    const response = await apiPatch(`/api/parse-issues/${issue.id}`, { status: 'ignored' });
    if (!response.ok) return setError(response.error);
    setNotice('Đã bỏ qua tin này.');
    await loadWorkspace({ force: true });
  }

  const cancelEdit = useCallback(() => {
    setEditingLine(null);
    setEditingText('');
  }, []);

  const startEdit = useCallback((ticket: Ticket) => {
    const sourceLineNumber = ticketSourceLine(ticket, workspace?.messages || []);
    setEditingLine({
      key: ticketLineKey(ticket, sourceLineNumber),
      messageId: ticket.ticket_message_id,
      sourceText: ticket.source_text || '',
      sourceLineNumber,
    });
    setEditingText(ticket.source_text || '');
  }, [workspace?.messages]);

  const saveEditedMessage = useCallback(async () => {
    if (!editingLine || !editingText.trim()) return setError('Tin sửa không được trống.');
    setNotice(`Đang thay dữ liệu của dòng ${editingLine.sourceLineNumber || '?'}...`);
    const response = await apiPost(`/api/ticket-messages/${editingLine.messageId}/reparse`, {
      correctedText: editingText,
      sourceText: editingLine.sourceText || undefined,
      mode: 'append',
    });
    if (!response.ok) return setError(response.error);
    setNotice(response.issues?.length ? 'Đã thay phần sửa được, vẫn còn cảnh báo cần xử lý.' : 'Đã thay dữ liệu của dòng sửa.');
    setEditingLine(null);
    setEditingText('');
    await loadWorkspace({ force: true });
  }, [editingLine, editingText, loadWorkspace]);

  const deleteMessage = useCallback(async (ticket: Ticket) => {
    setDialog({
      type: 'delete-ticket-line',
      messageId: ticket.ticket_message_id,
      ticketId: ticket.id,
      sourceText: ticket.source_text || '',
      sourceLineNumber: ticketSourceLine(ticket, workspace?.messages || []),
      playerId: ticket.player_id,
      playerName: ticket.player_name,
    });
  }, [workspace?.messages]);

  async function checkAll() {
    setNotice('Đang dò vé. Nếu chưa có KQ, hệ thống sẽ tự tải nguồn trước...');
    setError('');
    startTransition(async () => {
      const response = await apiPost('/api/check', { date, region });
      if (!response.ok) return setError(response.error);
      setNotice(response.message || `${response.autoFetched ? 'Đã tự tải KQ và ' : ''}Đã dò ${response.checked?.length || 0} vé.`);
      await loadWorkspace({ force: true });
    });
  }

  async function resetData(scope: 'day-region' | 'all') {
    const label = scope === 'all' ? 'toàn bộ dữ liệu của tài khoản này' : `dữ liệu ngày ${date} - ${regionName(region)}`;
    setDialogConfirm('');
    setDialog({ type: 'reset', scope, label });
  }

  async function confirmDialogAction() {
    if (!dialog) return;
    if (dialog.type === 'delete-player') {
      const response = await apiDelete('/api/players', { id: dialog.playerId });
      if (!response.ok) return setError(response.error);
      setNotice(`Đã xóa khách ${dialog.playerName} khỏi danh sách.`);
      const nextPlayer = (workspace?.players || []).find(player => player.id !== dialog.playerId);
      setPlayerSelectionTouched(true);
      setSelectedPlayerId(nextPlayer?.id || '');
      setDialog(null);
      await loadWorkspace({ force: true });
      return;
    }

    if (dialog.type === 'delete-ticket-line') {
      const response = await apiDelete(`/api/ticket-messages/${dialog.messageId}`, {
        ticketId: dialog.ticketId,
        sourceText: dialog.sourceText || undefined,
        sourceLineNo: dialog.sourceLineNumber ?? undefined,
        playerId: dialog.playerId,
        playerName: dialog.playerName,
        region,
      });
      if (!response.ok) return setError(response.error);
      setNotice(`Đã xóa ${response.deletedCount || 0} vé của đúng dòng tin này.`);
      setDialog(null);
      await loadWorkspace({ force: true });
      return;
    }

    if (dialogConfirm.trim() !== 'XOA TAT CA') return;
    const body = dialog.scope === 'all'
      ? { scope: dialog.scope, confirm: dialogConfirm.trim() }
      : { scope: dialog.scope, confirm: dialogConfirm.trim(), date, region };
    const response = await apiDelete('/api/workspace/reset', body);
    if (!response.ok) return setError(response.error);
    setNotice(dialog.scope === 'all' ? 'Đã xóa toàn bộ dữ liệu của tài khoản.' : 'Đã xóa dữ liệu ngày/miền hiện tại.');
    setDialog(null);
    setDialogConfirm('');
    await loadWorkspace({ force: true });
  }

  const dialogContent = dashboardDialogContent(dialog);

  return (
    <main className="app-shell">
      <AppHeader username={workspace?.profile?.username} role={workspace?.profile?.role} activePage="tickets" />

      <div className="workspace">
        <div className="main-flow">
          <section className={`control-panel ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
            <WorkDatePicker label="Ngày làm việc" value={date} onChange={setDate} />
            <div className="region-control" role="tablist" aria-label="Chọn miền">
              {REGIONS.map(item => (
                <button key={item.id} type="button" className={`region-tab ${region === item.id ? 'active' : ''}`} onClick={() => setRegion(item.id)}>
                  <span>{item.short}</span>
                  <small>{item.label}</small>
                </button>
              ))}
            </div>
            <div className="control-actions">
              <button className="btn soft" type="button" onClick={() => loadWorkspace({ force: true })}><RefreshCw size={17} className={loading ? 'spin' : ''} /> Tải lại</button>
              <Link className="btn soft" href="/results"><ListChecks size={17} /> Trang KQ</Link>
              <button className="btn green" type="button" onClick={checkAll} disabled={pending}><Calculator size={17} /> Dò vé</button>
            </div>
            {loading ? <span className="loading-chip"><RefreshCw size={14} className="spin" /> Đang tải</span> : null}
          </section>

          {notice ? <div className="notice">{notice}</div> : null}
          {error ? <div className="error">{error}</div> : null}

          <section className="summary-grid">
            <div className="metric metric-blue"><span>Vé trong ngày</span><strong>{totals.tickets}</strong><small>{regionName(region)}</small></div>
            <div className="metric metric-teal"><span>Tổng xác</span><strong>{money(totals.xac)}</strong><small>Tiền nhận</small></div>
            <div className="metric metric-green"><span>Tổng thắng</span><strong>{money(totals.win)}</strong><small>Đã dò</small></div>
            <div className="metric metric-amber"><span>Lãi lỗ</span><strong className={totals.win - totals.xac >= 0 ? 'positive' : 'negative'}>{money(totals.win - totals.xac)}</strong><small>Theo ngày/miền</small></div>
          </section>

          <section className="section input-section">
            <div className="section-header">
              <div>
                <h2 className="section-title"><Send size={18} /> Nhập tin</h2>
                <p className="section-note">{workspace?.config.regionName} - Đài hôm nay: {workspace?.config.activeDai.join(', ') || 'chưa có'}</p>
              </div>
              <span className="badge neutral">{activeIssues.length} tin cần sửa</span>
            </div>
            <form className="form-grid" onSubmit={submitTicket}>
              <div className="row">
                <select className="select compact" value={selectedPlayerId} onChange={event => choosePlayer(event.target.value)}>
                  <option value="">Tự nhận khách từ tin</option>
                  {workspace?.players.map(player => <option key={player.id} value={player.id}>{player.name}</option>)}
                </select>
                <button className="btn primary" type="submit" disabled={pending || !ticketText.trim()}><Plus size={17} /> Thêm tin</button>
              </div>
              <textarea className="textarea ticket-input" value={ticketText} onChange={event => setTicketText(event.target.value)} placeholder={'Ví dụ:\nb 12 10n dd 20n\n27 67b 80n xdui 80n'} />
            </form>
          </section>

          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title"><CheckCircle2 size={18} /> Bảng vé</h2>
                <p className="section-note">Bấm sửa ở dòng nào thì hệ thống thay lại vé của đúng dòng đó, các dòng khác giữ nguyên.</p>
              </div>
              <span className="muted">{filteredTickets.length} dòng</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>STT / dòng</th>
                    <th>Đài</th>
                    <th>Số</th>
                    <th>Loại</th>
                    <th>Điểm</th>
                    <th>Xác</th>
                    <th>KQ</th>
                    <th>Thắng</th>
                    <th>Tin gốc</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTickets.map((ticket, index) => {
                    const sourceLineNumber = ticketSourceLine(ticket, filteredMessages);
                    const lineKey = ticketLineKey(ticket, sourceLineNumber);
                    return (
                      <TableRows
                        key={ticket.id}
                        ticket={ticket}
                        rowNumber={index + 1}
                        messageNumber={messageOrder.get(ticket.ticket_message_id) || 0}
                        sourceLineNumber={sourceLineNumber}
                        lineKey={lineKey}
                        editingLineKey={editingLine?.key || ''}
                        editingText={editingText}
                        setEditingText={setEditingText}
                        startEdit={startEdit}
                        cancelEdit={cancelEdit}
                        saveEditedMessage={saveEditedMessage}
                        deleteMessage={deleteMessage}
                      />
                    );
                  })}
                </tbody>
              </table>
              {!filteredTickets.length ? <div className="empty-state">Chưa có vé của khách này trong ngày/miền đang chọn.</div> : null}
            </div>
          </section>
        </div>

        <aside className="sidebar-flow">
          {activeIssues.length ? (
            <section className="section issue-priority">
              <div className="section-header">
                <h2 className="section-title"><AlertTriangle size={18} /> Tin cần sửa</h2>
                <span className="badge warn">{activeIssues.length}</span>
              </div>
              <div className="issue-list">
                {activeIssues.map(issue => (
                  <div className="issue-item open" key={issue.id}>
                    <div className="issue-meta">
                      <span>Tin {messageOrder.get(issue.ticket_message_id) || '?'} · Dòng {issue.line_no || '?'}</span>
                      <span>{issue.status}</span>
                    </div>
                    <div className="issue-warning">{issue.warning}</div>
                    <textarea
                      className="textarea small"
                      value={issueDrafts[issue.id] ?? issue.source_text ?? ''}
                      onChange={event => setIssueDrafts(current => ({ ...current, [issue.id]: event.target.value }))}
                    />
                    <div className="row action-row">
                      <button className="btn primary" type="button" onClick={() => reparseIssue(issue)}><RefreshCw size={16} /> Sửa lại</button>
                      <button className="btn soft" type="button" onClick={() => ignoreIssue(issue)}><XCircle size={16} /> Bỏ qua</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="section">
            <div className="section-header">
              <h2 className="section-title"><UserRound size={18} /> Khách</h2>
            </div>
            <form className="row" onSubmit={createPlayer}>
              <input className="input" value={newPlayerName} onChange={event => setNewPlayerName(event.target.value)} placeholder="Tên khách mới" />
              <button className="btn primary" type="submit"><Plus size={16} /> Thêm</button>
            </form>
            {activePlayer && workspace ? (
              <RatesEditor player={activePlayer} config={workspace.config} onSave={saveRates} onDelete={deletePlayer} />
            ) : <div className="empty-state compact">Chọn hoặc thêm khách để chỉnh hệ số.</div>}
          </section>

          <section className="section danger-zone">
            <div className="section-header">
              <h2 className="section-title"><Trash2 size={18} /> Xóa dữ liệu</h2>
            </div>
            <p className="section-note">Các nút này yêu cầu nhập đúng cụm <b>XOA TAT CA</b> trước khi xóa.</p>
            <div className="form-grid">
              <button className="btn amber" type="button" onClick={() => resetData('day-region')}><Trash2 size={16} /> Xóa ngày/miền này</button>
              <button className="btn red" type="button" onClick={() => resetData('all')}><Trash2 size={16} /> Xóa tất cả dữ liệu</button>
            </div>
          </section>
        </aside>
      </div>
      {dialogContent ? (
        <ActionDialog
          open
          title={dialogContent.title}
          description={dialogContent.description}
          confirmLabel={dialogContent.confirmLabel}
          tone={dialogContent.tone}
          requireText={dialogContent.requireText}
          inputLabel={dialogContent.inputLabel}
          inputValue={dialogConfirm}
          onInputChange={setDialogConfirm}
          onCancel={() => {
            setDialog(null);
            setDialogConfirm('');
          }}
          onConfirm={confirmDialogAction}
        />
      ) : null}
    </main>
  );
}

function dashboardDialogContent(dialog: DashboardDialog | null) {
  if (!dialog) return null;
  if (dialog.type === 'delete-player') {
    return {
      title: 'Xóa khách',
      description: `Xóa khách "${dialog.playerName}" khỏi danh sách. Vé cũ vẫn được giữ để xem lịch sử.`,
      confirmLabel: 'Xóa khách',
      tone: 'danger' as const,
    };
  }
  if (dialog.type === 'delete-ticket-line') {
    return {
      title: 'Xóa dòng tin',
      description: `Chỉ xóa vé của ${dialog.playerName || 'khách này'} trong dòng ${dialog.sourceLineNumber || '?'} của miền đang xem. Các dòng khác trong cùng tin gốc được giữ nguyên.`,
      confirmLabel: 'Xóa dòng',
      tone: 'danger' as const,
    };
  }
  return {
    title: 'Xóa dữ liệu',
    description: `Gõ đúng XOA TAT CA để xóa ${dialog.label}. Thao tác này không hoàn tác.`,
    confirmLabel: 'Xóa dữ liệu',
    tone: dialog.scope === 'all' ? 'danger' as const : 'warning' as const,
    requireText: 'XOA TAT CA',
    inputLabel: 'Mã xác nhận',
  };
}

const TableRows = memo(function TableRows(props: {
  ticket: Ticket;
  rowNumber: number;
  messageNumber: number;
  sourceLineNumber: number | null;
  lineKey: string;
  editingLineKey: string;
  editingText: string;
  setEditingText: (value: string) => void;
  startEdit: (ticket: Ticket) => void;
  cancelEdit: () => void;
  saveEditedMessage: () => void;
  deleteMessage: (ticket: Ticket) => void;
}) {
  const isEditing = props.editingLineKey === props.lineKey;
  return (
    <>
      <tr>
        <td>
          <div className="ticket-index-cell">
            <span className="message-chip">Vé {props.rowNumber}</span>
            <span className="line-chip">Tin {props.messageNumber || '?'} · dòng {props.sourceLineNumber || '?'}</span>
          </div>
        </td>
        <td>{props.ticket.dai.join(', ')}</td>
        <td><b>{props.ticket.so_list.join(' · ')}</b></td>
        <td><TicketTypeBadge loai={props.ticket.loai} label={props.ticket.loai_label || props.ticket.loai} /></td>
        <td>{props.ticket.tien_dat}</td>
        <td>{money(props.ticket.xac)}</td>
        <td>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <StatusBadge status={props.ticket.status} winAmount={props.ticket.tien_thang} />
            {(props.ticket.status === 'TRUNG' || props.ticket.tien_thang > 0) && props.ticket.ghi_chu && (
              <div className="hit-details-inline" style={{ fontSize: '11px', color: '#10B981', whiteSpace: 'nowrap', textAlign: 'center' }}>
                {props.ticket.ghi_chu
                  .split('|')
                  .filter(Boolean)
                  .map((item, idx) => (
                    <div key={idx} style={{ lineHeight: '1.2' }}>
                      Trúng {item}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </td>
        <td>{props.ticket.tien_thang ? money(props.ticket.tien_thang) : ''}</td>
        <td className="source-cell"><HighlightedSource text={props.ticket.source_text} /></td>
        <td>
          <div className="table-actions">
            <button className="btn icon soft" type="button" title="Sửa riêng dòng này" onClick={() => props.startEdit(props.ticket)}><Edit3 size={16} /></button>
            <button className="btn icon danger-soft" type="button" title="Xóa tin" onClick={() => props.deleteMessage(props.ticket)}><Trash2 size={16} /></button>
          </div>
        </td>
      </tr>
      {isEditing ? (
        <tr className="edit-row">
          <td colSpan={10}>
            <div className="inline-editor">
              <textarea className="textarea small" value={props.editingText} onChange={event => props.setEditingText(event.target.value)} />
              <div className="row action-row">
                <button className="btn primary" type="button" onClick={props.saveEditedMessage}><Save size={16} /> Lưu sửa</button>
                <button className="btn soft" type="button" onClick={props.cancelEdit}>Hủy</button>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
});

function TicketTypeBadge({ loai, label }: { loai: string; label: string }) {
  return <span className={`type-badge type-${typeClass(loai)}`}>{label}</span>;
}

function HighlightedSource({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((part, index) => {
        if (!part.trim()) return part;
        const className = sourceTokenClass(part);
        return className ? <span className={`source-token ${className}`} key={`${part}-${index}`}>{part}</span> : part;
      })}
    </>
  );
}

function RatesEditor({ player, config, onSave, onDelete }: { player: Player; config: Workspace['config']; onSave: (rateProfile: Player['rate_profile']) => void; onDelete: () => void }) {
  const keys = Object.keys(config.heSoXacDefault);
  const [heSoXac, setHeSoXac] = useState<Record<string, number>>({});
  const [tyLe, setTyLe] = useState<Record<string, number>>({});

  useEffect(() => {
    setHeSoXac(toDisplayRates({ ...config.heSoXacDefault, ...(player.rate_profile?.heSoXac || {}) }));
    setTyLe(toDisplayRates({ ...config.tyLeDefault, ...(player.rate_profile?.tyLe || {}) }));
  }, [player.id, config, player.rate_profile]);

  function save() {
    onSave({
      heSoXac: fromDisplayRates(heSoXac),
      tyLe: fromDisplayRates(tyLe),
    });
  }

  return (
    <div className="form-grid rates-panel">
      <div>
        <div className="muted strong">{player.name}</div>
        <div className="mini-note">Giao diện rút gọn 1 số 0, hệ thống vẫn tính theo số gốc.</div>
      </div>
      <div className="rate-grid header">
        <span>Loại</span><span>Hệ số</span><span>Trúng</span>
      </div>
      {keys.map(key => (
        <div className="rate-grid" key={key}>
          <span>{RATE_LABELS[key] || key}</span>
          <input className="input" type="number" value={heSoXac[key] ?? ''} onChange={event => setHeSoXac(current => ({ ...current, [key]: Number(event.target.value || 0) }))} />
          <input className="input" type="number" value={tyLe[key] ?? ''} onChange={event => setTyLe(current => ({ ...current, [key]: Number(event.target.value || 0) }))} />
        </div>
      ))}
      <div className="row rates-actions">
        <button className="btn primary" type="button" onClick={save}><Save size={17} /> Lưu & cập nhật vé</button>
        <button className="btn danger-soft" type="button" onClick={onDelete}><Trash2 size={17} /> Xóa khách</button>
      </div>
    </div>
  );
}

function StatusBadge({ status, winAmount = 0 }: { status: string; winAmount?: number }) {
  if (status === 'TRUNG' || Number(winAmount || 0) > 0) return <span className="badge win">TRÚNG</span>;
  if (status === 'Truot') return <span className="badge loss">Trượt</span>;
  if (status === 'Chua co KQ') return <span className="badge warn">Chưa có KQ</span>;
  return <span className="badge neutral">?</span>;
}

async function apiPost(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  return { ok: response.ok && payload.ok, ...payload };
}

async function apiPatch(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  return { ok: response.ok && payload.ok, ...payload };
}

async function apiDelete(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  return { ok: response.ok && payload.ok, ...payload };
}

function toDisplayRates(values: Record<string, number>) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value || 0) / 10]));
}

function fromDisplayRates(values: Record<string, number>) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Math.round(Number(value || 0) * 10)]));
}

function typeClass(loai: string) {
  if (loai === 'Lo') return 'lo';
  if (loai === 'DauDuoi' || loai === 'Dau' || loai === 'Duoi') return 'dd';
  if (loai === '3Cang' || loai === 'Dau3C' || loai === 'Duoi3C' || loai === 'DauDuoi3C') return 'c3';
  if (loai === '4Cang') return 'c4';
  if (loai === 'XiuChu' || loai === 'XiuChuDau' || loai === 'XiuChuDuoi') return 'xc';
  if (loai.startsWith('Xien')) return 'xien';
  return 'other';
}

function sourceTokenClass(token: string) {
  const value = normalizeSourceToken(token);
  if (!value) return '';
  if (value === 'b' || value === 'bl' || value === 'blo' || value === 'bao' || /^\d{1,4}b{1,2}$/.test(value)) return 'source-lo';
  if (value === 'dd' || value === 'dau' || value === 'dui' || value === 'duoi') return 'source-dd';
  if (value === 'xc' || value === 'xchu' || value === 'xiuchu' || value === 'xdau' || value === 'xdui' || value === 'xduoi') return 'source-xc';
  if (value === '3c' || value === '3d' || value === '3dai') return 'source-3c';
  if (value === '4c' || value === '4d' || value === '4dai') return 'source-c4';
  if (value === '2c' || value === '2d' || value === 'xien') return 'source-2c';
  return '';
}

function normalizeSourceToken(token: string) {
  return token
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/^[^\da-z]+|[^\da-z]+$/g, '');
}

function ticketSourceLine(ticket: Ticket, messages: TicketMessage[]) {
  if (typeof ticket.source_line_no === 'number') return ticket.source_line_no;
  const message = messages.find(item => item.id === ticket.ticket_message_id);
  if (!message?.raw_text || !ticket.source_text) return null;
  const source = normalizeTicketLine(ticket.source_text);
  if (!source) return null;
  const lines = message.raw_text.split(/\r?\n/);
  const index = lines.findIndex(line => {
    const current = normalizeTicketLine(line);
    if (!current) return false;
    return current === source || current.includes(source) || source.includes(current);
  });
  return index >= 0 ? index + 1 : null;
}

function ticketLineKey(ticket: Ticket, sourceLineNumber: number | null) {
  return `${ticket.ticket_message_id}|${sourceLineNumber || ''}|${normalizeTicketLine(ticket.source_text || '')}`;
}

function normalizeTicketLine(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function groupOpenIssues(issues: ParseIssue[]) {
  const grouped = new Map<string, ParseIssue>();
  for (const issue of issues) {
    if (issue.status !== 'open') continue;
    const key = `${issue.ticket_message_id}|${issue.line_no || ''}|${normalizeTicketLine(issue.source_text || '') || issue.id}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { ...issue });
      continue;
    }
    if (!existing.warning.includes(issue.warning)) {
      existing.warning = `${existing.warning}; ${issue.warning}`;
    }
  }
  return [...grouped.values()];
}

function money(value: number) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function todayKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function regionName(region: Region) {
  return REGIONS.find(item => item.id === region)?.label || region;
}
