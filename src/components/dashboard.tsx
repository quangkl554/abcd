'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  AlertTriangle,
  Calculator,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
import { AppHeader } from './app-header';

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
};

type ParseIssue = {
  id: string;
  ticket_message_id: string;
  status: 'open' | 'resolved' | 'ignored';
  warning: string;
  line_no: number | null;
  source_text: string | null;
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
  tickets: Ticket[];
  issues: ParseIssue[];
  drawResults: Array<{ id: string; dai: string; source: string; prizes: Record<string, string[]> }>;
  summary: Array<{ playerName: string; soVe: number; tongXac: number; tongTrung: number; laiLo: number }>;
};

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
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const workspaceCache = useRef<Record<string, Workspace>>({});
  const requestSeq = useRef(0);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [ticketText, setTicketText] = useState('');
  const [issueDrafts, setIssueDrafts] = useState<Record<string, string>>({});
  const [editingMessageId, setEditingMessageId] = useState('');
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const activeIssues = useMemo(() => (workspace?.issues || []).filter(issue => issue.status === 'open'), [workspace]);
  const totals = useMemo(() => {
    const tickets = workspace?.tickets || [];
    return {
      tickets: tickets.length,
      xac: tickets.reduce((sum, ticket) => sum + Number(ticket.xac || 0), 0),
      win: tickets.reduce((sum, ticket) => sum + Number(ticket.tien_thang || 0), 0),
    };
  }, [workspace]);
  const activePlayer = workspace?.players.find(player => player.id === selectedPlayerId) || null;

  useEffect(() => {
    loadWorkspace({ targetDate: date, targetRegion: region });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, region]);

  async function loadWorkspace(options?: { force?: boolean; targetDate?: string; targetRegion?: Region }) {
    const queryDate = options?.targetDate || date;
    const queryRegion = options?.targetRegion || region;
    const cacheKey = `${queryDate}|${queryRegion}`;
    if (!options?.force && workspaceCache.current[cacheKey]) {
      setWorkspace(workspaceCache.current[cacheKey]);
    }
    const seq = ++requestSeq.current;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/workspace?date=${queryDate}&region=${queryRegion}`, { cache: 'no-store' });
      const payload = await response.json();
      if (seq !== requestSeq.current) return;
      if (!response.ok || !payload.ok) {
        setError(payload.error || 'Không tải được dữ liệu.');
        return;
      }
      workspaceCache.current[cacheKey] = payload as Workspace;
      setWorkspace(payload as Workspace);
      setSelectedPlayerId(current => current || payload.players?.[0]?.id || '');
    } catch {
      if (seq === requestSeq.current) setError('Không tải được dữ liệu.');
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }

  function submitTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
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
      if (!issueCount) setTicketText('');
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
      setSelectedPlayerId(response.player.id);
      await loadWorkspace({ force: true });
    });
  }

  async function saveRates(rateProfile: Player['rate_profile']) {
    if (!activePlayer) return;
    const response = await apiPatch('/api/players', { id: activePlayer.id, rateProfile });
    if (!response.ok) return setError(response.error);
    setNotice('Đã lưu hệ số và tỉ lệ cho khách.');
    await loadWorkspace({ force: true });
  }

  async function reparseIssue(issue: ParseIssue) {
    const correctedText = (issueDrafts[issue.id] || issue.source_text || '').trim();
    if (!correctedText) return setError('Tin sửa không được trống.');
    const response = await apiPost(`/api/ticket-messages/${issue.ticket_message_id}/reparse`, {
      correctedText,
      issueId: issue.id,
      mode: 'append',
    });
    if (!response.ok) return setError(response.error);
    setNotice(response.issues?.length ? 'Đã thêm phần parse được, vẫn còn cảnh báo cần xem.' : 'Đã thêm dữ liệu sửa và đóng cảnh báo.');
    await loadWorkspace({ force: true });
  }

  async function ignoreIssue(issue: ParseIssue) {
    const response = await apiPatch(`/api/parse-issues/${issue.id}`, { status: 'ignored' });
    if (!response.ok) return setError(response.error);
    setNotice('Đã bỏ qua tin này.');
    await loadWorkspace({ force: true });
  }

  function startEdit(ticket: Ticket) {
    setEditingMessageId(ticket.ticket_message_id);
    setEditingText(ticket.source_text || '');
  }

  async function saveEditedMessage() {
    if (!editingMessageId || !editingText.trim()) return setError('Tin sửa không được trống.');
    const response = await apiPost(`/api/ticket-messages/${editingMessageId}/reparse`, { correctedText: editingText, mode: 'append' });
    if (!response.ok) return setError(response.error);
    setNotice(response.issues?.length ? 'Đã thêm phần sửa được, vẫn còn cảnh báo cần xử lý.' : 'Đã thêm dữ liệu từ tin sửa, không xóa vé cũ.');
    setEditingMessageId('');
    setEditingText('');
    await loadWorkspace({ force: true });
  }

  async function deleteMessage(ticket: Ticket) {
    const ok = window.confirm('Xóa tin gốc này sẽ xóa toàn bộ vé được sinh ra từ tin đó. Bạn chắc chắn muốn xóa?');
    if (!ok) return;
    const response = await apiDelete(`/api/ticket-messages/${ticket.ticket_message_id}`);
    if (!response.ok) return setError(response.error);
    setNotice('Đã xóa tin và các vé liên quan.');
    await loadWorkspace({ force: true });
  }

  async function checkAll() {
    setNotice('');
    setError('');
    startTransition(async () => {
      const response = await apiPost('/api/check', { date, region });
      if (!response.ok) return setError(response.error);
      setNotice(response.message || `Đã dò ${response.checked?.length || 0} vé.`);
      await loadWorkspace({ force: true });
    });
  }

  async function resetData(scope: 'day-region' | 'all') {
    const label = scope === 'all' ? 'toàn bộ dữ liệu của tài khoản này' : `dữ liệu ngày ${date} - ${regionName(region)}`;
    const confirmText = window.prompt(`Nhập chính xác XOA TAT CA để xóa ${label}. Thao tác này không hoàn tác.`);
    if (confirmText !== 'XOA TAT CA') return;
    const body = scope === 'all'
      ? { scope, confirm: confirmText }
      : { scope, confirm: confirmText, date, region };
    const response = await apiDelete('/api/workspace/reset', body);
    if (!response.ok) return setError(response.error);
    setNotice(scope === 'all' ? 'Đã xóa toàn bộ dữ liệu của tài khoản.' : 'Đã xóa dữ liệu ngày/miền hiện tại.');
    await loadWorkspace({ force: true });
  }

  return (
    <main className="app-shell">
      <AppHeader username={workspace?.profile?.username} role={workspace?.profile?.role} activePage="tickets" />

      <div className="workspace">
        <div className="main-flow">
          <section className={`control-panel ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
            <div className="date-control">
              <button className="date-step" type="button" title="Ngày trước" onClick={() => setDate(shiftDate(date, -1))}><ChevronLeft size={17} /></button>
              <label>
                <span><CalendarDays size={14} /> Ngày làm việc</span>
                <input type="date" value={date} onChange={event => setDate(event.target.value)} />
              </label>
              <button className="date-step" type="button" title="Ngày sau" onClick={() => setDate(shiftDate(date, 1))}><ChevronRight size={17} /></button>
            </div>
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
                <select className="select compact" value={selectedPlayerId} onChange={event => setSelectedPlayerId(event.target.value)}>
                  <option value="">Tự nhận khách từ tin</option>
                  {workspace?.players.map(player => <option key={player.id} value={player.id}>{player.name}</option>)}
                </select>
                <button className="btn primary" type="submit" disabled={pending || !ticketText.trim()}><Plus size={17} /> Thêm tin</button>
              </div>
              <textarea className="textarea ticket-input" value={ticketText} onChange={event => setTicketText(event.target.value)} placeholder={'Ví dụ:\nnguoi 1\nb 12 10n dd 20n'} />
            </form>
          </section>

          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title"><CheckCircle2 size={18} /> Bảng vé</h2>
                <p className="section-note">Sửa/parse lại sẽ thêm dữ liệu mới và giữ nguyên các vé đã nhận trước đó.</p>
              </div>
              <span className="muted">{workspace?.tickets.length || 0} dòng</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Khách</th>
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
                  {(workspace?.tickets || []).map(ticket => (
                    <TableRows
                      key={ticket.id}
                      ticket={ticket}
                      editingMessageId={editingMessageId}
                      editingText={editingText}
                      setEditingText={setEditingText}
                      startEdit={startEdit}
                      cancelEdit={() => {
                        setEditingMessageId('');
                        setEditingText('');
                      }}
                      saveEditedMessage={saveEditedMessage}
                      deleteMessage={deleteMessage}
                    />
                  ))}
                </tbody>
              </table>
              {!workspace?.tickets.length ? <div className="empty-state">Chưa có vé trong ngày/miền này.</div> : null}
            </div>
          </section>
        </div>

        <aside className="sidebar-flow">
          <section className="section">
            <div className="section-header">
              <h2 className="section-title"><AlertTriangle size={18} /> Tin cần sửa</h2>
              <span className="badge warn">{activeIssues.length}</span>
            </div>
            <div className="issue-list">
              {(workspace?.issues || []).length ? workspace?.issues.map(issue => (
                <div className={`issue-item ${issue.status}`} key={issue.id}>
                  <div className="issue-meta">
                    <span>Dòng {issue.line_no || '?'}</span>
                    <span>{issue.status}</span>
                  </div>
                  <div className="issue-warning">{issue.warning}</div>
                  <textarea
                    className="textarea small"
                    value={issueDrafts[issue.id] ?? issue.source_text ?? ''}
                    disabled={issue.status !== 'open'}
                    onChange={event => setIssueDrafts(current => ({ ...current, [issue.id]: event.target.value }))}
                  />
                  {issue.status === 'open' ? (
                    <div className="row action-row">
                      <button className="btn primary" type="button" onClick={() => reparseIssue(issue)}><RefreshCw size={16} /> Parse lại</button>
                      <button className="btn soft" type="button" onClick={() => ignoreIssue(issue)}><XCircle size={16} /> Bỏ qua</button>
                    </div>
                  ) : null}
                </div>
              )) : <div className="empty-state compact">Không có tin lỗi.</div>}
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <h2 className="section-title"><UserRound size={18} /> Khách</h2>
            </div>
            <form className="row" onSubmit={createPlayer}>
              <input className="input" value={newPlayerName} onChange={event => setNewPlayerName(event.target.value)} placeholder="Tên khách mới" />
              <button className="btn primary" type="submit"><Plus size={16} /> Thêm</button>
            </form>
            {activePlayer && workspace ? (
              <RatesEditor player={activePlayer} config={workspace.config} onSave={saveRates} />
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
    </main>
  );
}

function TableRows(props: {
  ticket: Ticket;
  editingMessageId: string;
  editingText: string;
  setEditingText: (value: string) => void;
  startEdit: (ticket: Ticket) => void;
  cancelEdit: () => void;
  saveEditedMessage: () => void;
  deleteMessage: (ticket: Ticket) => void;
}) {
  const isEditing = props.editingMessageId === props.ticket.ticket_message_id;
  return (
    <>
      <tr>
        <td>{props.ticket.player_name}</td>
        <td>{props.ticket.dai.join(', ')}</td>
        <td><b>{props.ticket.so_list.join(' · ')}</b></td>
        <td><span className="badge neutral">{props.ticket.loai_label || props.ticket.loai}</span></td>
        <td>{props.ticket.tien_dat}</td>
        <td>{money(props.ticket.xac)}</td>
        <td><StatusBadge status={props.ticket.status} /></td>
        <td>{props.ticket.tien_thang ? money(props.ticket.tien_thang) : ''}</td>
        <td className="source-cell">{props.ticket.source_text}</td>
        <td>
          <div className="table-actions">
            <button className="btn icon soft" type="button" title="Thêm bản sửa từ tin này" onClick={() => props.startEdit(props.ticket)}><Edit3 size={16} /></button>
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
}

function RatesEditor({ player, config, onSave }: { player: Player; config: Workspace['config']; onSave: (rateProfile: Player['rate_profile']) => void }) {
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
      <button className="btn primary" type="button" onClick={save}><Save size={17} /> Lưu hệ số</button>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'TRUNG') return <span className="badge win">TRÚNG</span>;
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

function money(value: number) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function todayKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function shiftDate(value: string, days: number) {
  const next = new Date(`${value}T00:00:00`);
  next.setDate(next.getDate() + days);
  const offset = next.getTimezoneOffset() * 60_000;
  return new Date(next.getTime() - offset).toISOString().slice(0, 10);
}

function regionName(region: Region) {
  return REGIONS.find(item => item.id === region)?.label || region;
}
