'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { AlertTriangle, Calculator, CheckCircle2, Download, LogOut, Plus, RefreshCw, Save, Send, Settings, UserRound, XCircle } from 'lucide-react';

type Region = 'nam' | 'trung' | 'bac';

type Player = {
  id: string;
  name: string;
  active: boolean;
  rate_profile: { heSoXac?: Record<string, number>; tyLe?: Record<string, number> };
};

type Ticket = {
  id: string;
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

type DrawResult = {
  id: string;
  dai: string;
  source: string;
  prizes: Record<string, string[]>;
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
  };
  players: Player[];
  tickets: Ticket[];
  issues: ParseIssue[];
  drawResults: DrawResult[];
  summary: Array<{ playerName: string; soVe: number; tongXac: number; tongTrung: number; laiLo: number }>;
};

const REGIONS: Array<{ id: Region; label: string }> = [
  { id: 'nam', label: 'Miền Nam' },
  { id: 'trung', label: 'Miền Trung' },
  { id: 'bac', label: 'Miền Bắc' },
];

export function Dashboard() {
  const [date, setDate] = useState(todayKey());
  const [region, setRegion] = useState<Region>('nam');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [ticketText, setTicketText] = useState('');
  const [manualKq, setManualKq] = useState('');
  const [issueDrafts, setIssueDrafts] = useState<Record<string, string>>({});
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
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, region]);

  async function loadWorkspace() {
    setError('');
    const response = await fetch(`/api/workspace?date=${date}&region=${region}`, { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setError(payload.error || 'Khong tai du lieu duoc.');
      return;
    }
    setWorkspace(payload as Workspace);
    setSelectedPlayerId(current => current || payload.players?.[0]?.id || '');
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
      await loadWorkspace();
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
      await loadWorkspace();
    });
  }

  async function saveRates(rateProfile: Player['rate_profile']) {
    if (!activePlayer) return;
    const response = await apiPatch('/api/players', { id: activePlayer.id, rateProfile });
    if (!response.ok) return setError(response.error);
    setNotice('Đã lưu hệ số và tỉ lệ cho khách.');
    await loadWorkspace();
  }

  async function reparseIssue(issue: ParseIssue) {
    const correctedText = (issueDrafts[issue.id] || issue.source_text || '').trim();
    if (!correctedText) return setError('Tin sửa không được trống.');
    const response = await apiPost(`/api/ticket-messages/${issue.ticket_message_id}/reparse`, { correctedText });
    if (!response.ok) return setError(response.error);
    setNotice(response.issues?.length ? 'Đã parse lại, vẫn còn cảnh báo cần xem.' : 'Đã sửa và đóng cảnh báo.');
    await loadWorkspace();
  }

  async function ignoreIssue(issue: ParseIssue) {
    const response = await apiPatch(`/api/parse-issues/${issue.id}`, { status: 'ignored' });
    if (!response.ok) return setError(response.error);
    setNotice('Đã bỏ qua tin này.');
    await loadWorkspace();
  }

  async function fetchDraw() {
    setNotice('');
    setError('');
    startTransition(async () => {
      const response = await apiPost('/api/draw-results/fetch', { date, region });
      if (!response.ok) return setError(response.error);
      if (response.needsManual) {
        setNotice(`${response.reason} Hãy dán kết quả vào ô nhập tay.`);
      } else {
        setNotice('Đã tải và lưu kết quả từ URL.');
        await loadWorkspace();
      }
    });
  }

  async function saveManualDraw() {
    if (!manualKq.trim()) return setError('Chưa có nội dung kết quả để lưu.');
    const response = await apiPost('/api/draw-results/manual', { date, region, text: manualKq });
    if (!response.ok) return setError(response.error);
    setManualKq('');
    setNotice('Đã lưu kết quả thủ công.');
    await loadWorkspace();
  }

  async function checkAll() {
    setNotice('');
    setError('');
    startTransition(async () => {
      const response = await apiPost('/api/check', { date, region });
      if (!response.ok) return setError(response.error);
      setNotice(response.message || `Đã dò ${response.checked?.length || 0} vé.`);
      await loadWorkspace();
    });
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">XS</div>
          <div>
            <div>Xoso Web</div>
            <div className="muted" style={{ fontSize: 12 }}>Nhập tin, sửa lỗi, dò kết quả</div>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="badge"><UserRound size={14} /> {workspace?.profile?.username || 'user'}</span>
          {workspace?.profile?.role === 'admin' ? <Link className="btn" href="/admin"><Settings size={17} /> Admin</Link> : null}
          <button className="btn icon" type="button" title="Đăng xuất" onClick={logout}><LogOut size={18} /></button>
        </div>
      </header>

      <div className="workspace">
        <div className="main-flow">
          <section className="section">
            <div className="controls">
              <input className="input" type="date" value={date} onChange={event => setDate(event.target.value)} />
              <div className="segmented">
                {REGIONS.map(item => (
                  <button key={item.id} type="button" className={`segment ${region === item.id ? 'active' : ''}`} onClick={() => setRegion(item.id)}>
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="row">
                <button className="btn" type="button" onClick={loadWorkspace}><RefreshCw size={17} /> Tải lại</button>
                <button className="btn green" type="button" onClick={checkAll} disabled={pending}><Calculator size={17} /> Dò kết quả</button>
              </div>
            </div>
          </section>

          {notice ? <div className="notice">{notice}</div> : null}
          {error ? <div className="error">{error}</div> : null}

          <section className="section">
            <div className="summary-grid">
              <div className="metric"><span>Vé trong ngày</span><strong>{totals.tickets}</strong></div>
              <div className="metric"><span>Tổng xác</span><strong>{money(totals.xac)}</strong></div>
              <div className="metric"><span>Tổng thắng</span><strong>{money(totals.win)}</strong></div>
              <div className="metric"><span>Lãi lỗ</span><strong>{money(totals.win - totals.xac)}</strong></div>
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <h2 className="section-title"><Send size={18} /> Nhập tin</h2>
              <span className="muted">{workspace?.config.regionName} - Đài hôm nay: {workspace?.config.activeDai.join(', ')}</span>
            </div>
            <form className="form-grid" onSubmit={submitTicket}>
              <div className="row">
                <select className="select" value={selectedPlayerId} onChange={event => setSelectedPlayerId(event.target.value)} style={{ maxWidth: 260 }}>
                  <option value="">Tự nhận khách từ tin</option>
                  {workspace?.players.map(player => <option key={player.id} value={player.id}>{player.name}</option>)}
                </select>
                <button className="btn primary" type="submit" disabled={pending || !ticketText.trim()}><Plus size={17} /> Thêm tin</button>
              </div>
              <textarea className="textarea" value={ticketText} onChange={event => setTicketText(event.target.value)} placeholder="Ví dụ: nguoi 1&#10;b 12 10n dd 20n" />
            </form>
          </section>

          <section className="section">
            <div className="section-header">
              <h2 className="section-title"><Download size={18} /> Kết quả xổ số</h2>
              <div className="row">
                <button className="btn" type="button" onClick={fetchDraw} disabled={pending}><Download size={17} /> Tải URL</button>
                <button className="btn primary" type="button" onClick={saveManualDraw}><Save size={17} /> Lưu dán tay</button>
              </div>
            </div>
            <textarea className="textarea" value={manualKq} onChange={event => setManualKq(event.target.value)} placeholder="Dán kết quả nếu URL chưa nhận ra được..." />
            <div className="draw-grid" style={{ marginTop: 10 }}>
              {(workspace?.drawResults || []).map(draw => (
                <div className="draw-station" key={draw.id}>
                  <h3>{draw.dai}</h3>
                  <div className="muted" style={{ fontSize: 12 }}>Nguồn: {draw.source}</div>
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    {Object.entries(draw.prizes).map(([key, values]) => (
                      <div key={key}><b>{key}</b>: {values.join(', ')}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <h2 className="section-title"><CheckCircle2 size={18} /> Bảng vé</h2>
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
                  </tr>
                </thead>
                <tbody>
                  {(workspace?.tickets || []).map(ticket => (
                    <tr key={ticket.id}>
                      <td>{ticket.player_name}</td>
                      <td>{ticket.dai.join(', ')}</td>
                      <td><b>{ticket.so_list.join(' · ')}</b></td>
                      <td><span className="badge">{ticket.loai_label || ticket.loai}</span></td>
                      <td>{ticket.tien_dat}</td>
                      <td>{money(ticket.xac)}</td>
                      <td><StatusBadge status={ticket.status} /></td>
                      <td>{ticket.tien_thang ? money(ticket.tien_thang) : ''}</td>
                      <td className="muted">{ticket.source_text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    className="textarea"
                    style={{ minHeight: 86 }}
                    value={issueDrafts[issue.id] ?? issue.source_text ?? ''}
                    disabled={issue.status !== 'open'}
                    onChange={event => setIssueDrafts(current => ({ ...current, [issue.id]: event.target.value }))}
                  />
                  {issue.status === 'open' ? (
                    <div className="row" style={{ marginTop: 8 }}>
                      <button className="btn primary" type="button" onClick={() => reparseIssue(issue)}><RefreshCw size={16} /> Parse lại</button>
                      <button className="btn" type="button" onClick={() => ignoreIssue(issue)}><XCircle size={16} /> Bỏ qua</button>
                    </div>
                  ) : null}
                </div>
              )) : <div className="muted">Không có tin lỗi.</div>}
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
            ) : <div className="muted" style={{ marginTop: 10 }}>Chọn hoặc thêm khách để chỉnh hệ số.</div>}
          </section>
        </aside>
      </div>
    </main>
  );
}

function RatesEditor({ player, config, onSave }: { player: Player; config: Workspace['config']; onSave: (rateProfile: Player['rate_profile']) => void }) {
  const keys = Object.keys(config.heSoXacDefault);
  const [heSoXac, setHeSoXac] = useState<Record<string, number>>({});
  const [tyLe, setTyLe] = useState<Record<string, number>>({});

  useEffect(() => {
    setHeSoXac({ ...config.heSoXacDefault, ...(player.rate_profile?.heSoXac || {}) });
    setTyLe({ ...config.tyLeDefault, ...(player.rate_profile?.tyLe || {}) });
  }, [player.id, config, player.rate_profile]);

  return (
    <div className="form-grid" style={{ marginTop: 12 }}>
      <div className="muted" style={{ fontWeight: 700 }}>{player.name}</div>
      <div className="rate-grid header">
        <span>Loại</span><span>Hệ số</span><span>Tỉ lệ</span>
      </div>
      {keys.map(key => (
        <div className="rate-grid" key={key}>
          <span>{key}</span>
          <input className="input" type="number" value={heSoXac[key] || ''} onChange={event => setHeSoXac(current => ({ ...current, [key]: Number(event.target.value || 0) }))} />
          <input className="input" type="number" value={tyLe[key] || ''} onChange={event => setTyLe(current => ({ ...current, [key]: Number(event.target.value || 0) }))} />
        </div>
      ))}
      <button className="btn primary" type="button" onClick={() => onSave({ heSoXac, tyLe })}><Save size={17} /> Lưu hệ số</button>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'TRUNG') return <span className="badge win">TRÚNG</span>;
  if (status === 'Truot') return <span className="badge loss">Trượt</span>;
  if (status === 'Chua co KQ') return <span className="badge warn">Chưa có KQ</span>;
  return <span className="badge">?</span>;
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

function money(value: number) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function todayKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
