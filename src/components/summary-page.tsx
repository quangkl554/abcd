'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Gauge,
  ListChecks,
  RefreshCw,
  Target,
  Trophy,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import { useWorkspaceData } from '@/lib/use-workspace-data';
import { AppHeader } from './app-header';

type Region = 'nam' | 'trung' | 'bac';
type RegionScope = Region | 'all';

type Player = {
  id: string;
  name: string;
  active: boolean;
};

type Ticket = {
  id: string;
  player_id: string | null;
  player_name: string;
  region?: Region;
  dai: string[];
  loai: string;
  loai_label: string;
  status: string;
  xac: number;
  tien_thang: number;
};

type Workspace = {
  profile: { username: string; role: 'admin' | 'user' };
  config: {
    region: RegionScope;
    regionName: string;
    activeDai: string[];
  };
  players: Player[];
  tickets: Ticket[];
  drawResults: Array<{ id: string; dai: string }>;
  summary: Array<{ playerId: string | null; playerName: string; soVe: number; tongXac: number; tongTrung: number; laiLo: number }>;
};

type MetricRow = {
  label: string;
  count: number;
  xac: number;
  win: number;
  net: number;
};

type PlayerSummaryRow = {
  playerId: string | null;
  playerName: string;
  soVe: number;
  tongXac: number;
  tongTrung: number;
  laiLo: number;
};

type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
  tone: 'blue' | 'teal' | 'green' | 'amber';
  icon: ReactNode;
  percent: number;
};

const REGIONS: Array<{ id: RegionScope; label: string; short: string }> = [
  { id: 'all', label: 'Cả ngày', short: 'Cả ngày' },
  { id: 'nam', label: 'Miền Nam', short: 'Nam' },
  { id: 'trung', label: 'Miền Trung', short: 'Trung' },
  { id: 'bac', label: 'Miền Bắc', short: 'Bắc' },
];

export function SummaryPage() {
  const [date, setDate] = useState(todayKey());
  const [region, setRegion] = useState<RegionScope>('all');
  const [selectedPlayerId, setSelectedPlayerId] = useState('all');
  const { workspace, loading, error, loadWorkspace } = useWorkspaceData<Workspace>(date, region);

  const tickets = useMemo(() => {
    const rows = workspace?.tickets || [];
    if (selectedPlayerId === 'all') return rows;
    const player = workspace?.players.find(item => item.id === selectedPlayerId);
    return rows.filter(ticket => ticket.player_id === selectedPlayerId || (!ticket.player_id && player && ticket.player_name === player.name));
  }, [selectedPlayerId, workspace?.players, workspace?.tickets]);
  const summaryRows = useMemo(() => groupByPlayer(tickets), [tickets]);
  const totals = useMemo(() => ({
    tickets: tickets.length,
    xac: tickets.reduce((sum, ticket) => sum + Number(ticket.xac || 0), 0),
    win: tickets.reduce((sum, ticket) => sum + Number(ticket.tien_thang || 0), 0),
    checked: tickets.filter(ticket => statusLabel(ticket) !== 'Chưa có KQ').length,
  }), [tickets]);
  const byDai = useMemo(() => groupByDai(tickets), [tickets]);
  const byStatus = useMemo(() => groupTickets(tickets, statusLabel), [tickets]);
  const topPlayers = useMemo(() => summaryRows.slice(0, 5), [summaryRows]);
  const maxDaiXac = useMemo(() => Math.max(1, ...byDai.map(row => row.xac)), [byDai]);
  const dashboardMetrics = useMemo<DashboardMetric[]>(() => {
    const hitCount = tickets.filter(ticket => ticket.status === 'TRUNG' || Number(ticket.tien_thang || 0) > 0).length;
    const checkedRate = totals.tickets ? Math.round((totals.checked / totals.tickets) * 100) : 0;
    const hitRate = totals.checked ? Math.round((hitCount / totals.checked) * 100) : 0;
    const payoutRate = totals.xac ? Math.round((totals.win / totals.xac) * 100) : 0;
    const averageXac = totals.tickets ? totals.xac / totals.tickets : 0;
    return [
      { label: 'Đã dò', value: `${checkedRate}%`, detail: `${totals.checked}/${totals.tickets} vé`, tone: 'blue', icon: <Gauge size={18} />, percent: checkedRate },
      { label: 'Tỷ lệ trúng', value: `${hitRate}%`, detail: `${hitCount} vé trúng`, tone: 'green', icon: <Target size={18} />, percent: hitRate },
      { label: 'Trả thưởng', value: `${payoutRate}%`, detail: 'thắng / xác', tone: 'teal', icon: <TrendingUp size={18} />, percent: Math.min(payoutRate, 100) },
      { label: 'Xác trung bình', value: money(averageXac), detail: 'mỗi vé', tone: 'amber', icon: <Activity size={18} />, percent: totals.tickets ? 72 : 0 },
    ];
  }, [tickets, totals.checked, totals.tickets, totals.win, totals.xac]);

  useEffect(() => {
    if (selectedPlayerId === 'all') return;
    if (!workspace?.players.some(player => player.id === selectedPlayerId)) {
      setSelectedPlayerId('all');
    }
  }, [selectedPlayerId, workspace?.players]);

  return (
    <main className="app-shell">
      <AppHeader username={workspace?.profile?.username} role={workspace?.profile?.role} activePage="summary" />

      <div className="workspace summary-workspace">
        <div className="main-flow">
          <section className={`control-panel ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
            <div className="date-control">
              <button className="date-step" type="button" title="Ngày trước" onClick={() => setDate(shiftDate(date, -1))}><ChevronLeft size={17} /></button>
              <label>
                <span><CalendarDays size={14} /> Ngày tổng hợp</span>
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
              <Link className="btn soft" href="/app"><FileText size={17} /> Vé</Link>
              <Link className="btn soft" href="/results"><ListChecks size={17} /> Kết quả</Link>
            </div>
            {loading ? <span className="loading-chip"><RefreshCw size={14} className="spin" /> Đang tải</span> : null}
          </section>

          {error ? <div className="error">{error}</div> : null}

          <section className="summary-grid">
            <div className="metric metric-blue"><span>Vé trong ngày</span><strong>{totals.tickets}</strong><small>{workspace?.config.regionName || regionName(region)}</small></div>
            <div className="metric metric-teal"><span>Tổng xác</span><strong>{money(totals.xac)}</strong><small>Tiền nhận</small></div>
            <div className="metric metric-green"><span>Tổng thắng</span><strong>{money(totals.win)}</strong><small>{totals.checked} vé đã dò</small></div>
            <div className="metric metric-amber"><span>Lãi lỗ</span><strong className={totals.win - totals.xac >= 0 ? 'positive' : 'negative'}>{money(totals.win - totals.xac)}</strong><small>Theo ngày/miền</small></div>
          </section>

          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title"><UsersRound size={18} /> Tổng theo khách</h2>
                <p className="section-note">Kết quả tính trên ngày, miền và vé đang chọn.</p>
              </div>
              <span className="badge neutral">{summaryRows.length} khách</span>
            </div>
            <div className="summary-table">
              <div className="summary-table-head">
                <div className="summary-head-cell">
                  <span>Khách</span>
                  <select className="select summary-player-select" value={selectedPlayerId} onChange={event => setSelectedPlayerId(event.target.value)}>
                    <option value="all">Tất cả khách</option>
                    {workspace?.players.map(player => <option key={player.id} value={player.id}>{player.name}</option>)}
                  </select>
                </div>
                <span>Vé</span><span>Xác</span><span>Thắng</span><span>Lãi lỗ</span>
              </div>
              {summaryRows.map((row, index) => (
                <div className={`summary-table-row ${index < 3 ? 'highlight' : ''}`} key={row.playerId || row.playerName}>
                  <b className="summary-player-name">{row.playerName}</b>
                  <span>{row.soVe}</span>
                  <span>{money(row.tongXac)}</span>
                  <span>{money(row.tongTrung)}</span>
                  <strong className={row.laiLo >= 0 ? 'positive' : 'negative'}>{money(row.laiLo)}</strong>
                </div>
              ))}
              {!summaryRows.length ? <div className="empty-state compact">Chưa có vé để tổng hợp.</div> : null}
            </div>
          </section>

          <div className="dashboard-grid">
            <section className="section dashboard-overview">
              <div className="section-header">
                <div>
                  <h2 className="section-title"><BarChart3 size={18} /> Dashboard tổng hợp</h2>
                  <p className="section-note">Theo ngày, miền và khách đang chọn.</p>
                </div>
              </div>
              <div className="dashboard-card-grid">
                {dashboardMetrics.map(metric => <DashboardCard metric={metric} key={metric.label} />)}
              </div>
            </section>
            <VisualBarSection title="Phân bổ theo đài" icon={<CircleDollarSign size={18} />} rows={byDai} maxXac={maxDaiXac} />
            <StatsSection title="Trạng thái dò" icon={<Trophy size={18} />} rows={byStatus} />
            <PlayerBoard rows={topPlayers} />
          </div>
        </div>
      </div>
    </main>
  );
}

function DashboardCard({ metric }: { metric: DashboardMetric }) {
  return (
    <div className={`dashboard-card tone-${metric.tone}`}>
      <div className="dashboard-card-title">
        {metric.icon}
        <span>{metric.label}</span>
      </div>
      <strong>{metric.value}</strong>
      <small>{metric.detail}</small>
      <div className="dashboard-progress" aria-hidden="true">
        <span style={{ width: `${clampPercent(metric.percent)}%` }} />
      </div>
    </div>
  );
}

function VisualBarSection({ title, icon, rows, maxXac }: { title: string; icon: ReactNode; rows: MetricRow[]; maxXac: number }) {
  return (
    <section className="section dashboard-panel">
      <div className="section-header">
        <h2 className="section-title">{icon}{title}</h2>
      </div>
      <div className="visual-list">
        {rows.slice(0, 8).map(row => (
          <div className="visual-row" key={row.label}>
            <div className="visual-row-head">
              <b>{row.label}</b>
              <span>{row.count} vé</span>
            </div>
            <div className="visual-bar" aria-hidden="true">
              <span style={{ width: `${clampPercent((row.xac / maxXac) * 100)}%` }} />
            </div>
            <div className="visual-row-foot">
              <span>xác {money(row.xac)}</span>
              <strong className={row.net >= 0 ? 'positive' : 'negative'}>{money(row.net)}</strong>
            </div>
          </div>
        ))}
        {!rows.length ? <div className="empty-state compact">Chưa có dữ liệu.</div> : null}
      </div>
    </section>
  );
}

function PlayerBoard({ rows }: { rows: PlayerSummaryRow[] }) {
  return (
    <section className="section dashboard-panel">
      <div className="section-header">
        <h2 className="section-title"><UsersRound size={18} /> Khách nổi bật</h2>
      </div>
      <div className="leader-list">
        {rows.map((row, index) => (
          <div className="leader-row" key={row.playerId || row.playerName}>
            <span className="rank-chip">{index + 1}</span>
            <div>
              <b>{row.playerName}</b>
              <small>{row.soVe} vé · xác {money(row.tongXac)}</small>
            </div>
            <strong className={row.laiLo >= 0 ? 'positive' : 'negative'}>{money(row.laiLo)}</strong>
          </div>
        ))}
        {!rows.length ? <div className="empty-state compact">Chưa có dữ liệu.</div> : null}
      </div>
    </section>
  );
}

function StatsSection({ title, icon, rows }: { title: string; icon: ReactNode; rows: MetricRow[] }) {
  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">{icon}{title}</h2>
      </div>
      <div className="stat-list">
        {rows.map(row => (
          <div className="stat-row" key={row.label}>
            <div>
              <b>{row.label}</b>
              <small>{row.count} vé</small>
            </div>
            <div>
              <span>xác {money(row.xac)}</span>
              <strong className={row.net >= 0 ? 'positive' : 'negative'}>{money(row.net)}</strong>
            </div>
          </div>
        ))}
        {!rows.length ? <div className="empty-state compact">Chưa có dữ liệu.</div> : null}
      </div>
    </section>
  );
}

function groupTickets(tickets: Ticket[], getLabel: (ticket: Ticket) => string) {
  const rows = new Map<string, MetricRow>();
  for (const ticket of tickets) {
    addMetric(rows, getLabel(ticket), ticket);
  }
  return sortRows(rows);
}

function groupByPlayer(tickets: Ticket[]) {
  const rows = new Map<string, PlayerSummaryRow>();
  for (const ticket of tickets) {
    const key = ticket.player_id || ticket.player_name || 'Khach';
    const row = rows.get(key) || { playerId: ticket.player_id || null, playerName: ticket.player_name || 'Khach', soVe: 0, tongXac: 0, tongTrung: 0, laiLo: 0 };
    row.soVe += 1;
    row.tongXac += Number(ticket.xac || 0);
    row.tongTrung += Number(ticket.tien_thang || 0);
    row.laiLo = row.tongTrung - row.tongXac;
    rows.set(key, row);
  }
  return [...rows.values()].sort((a, b) => Math.abs(b.laiLo) - Math.abs(a.laiLo));
}

function groupByDai(tickets: Ticket[]) {
  const rows = new Map<string, MetricRow>();
  for (const ticket of tickets) {
    const dais = ticket.dai?.length ? ticket.dai : ['Chưa rõ'];
    const share = 1 / dais.length;
    for (const dai of dais) addMetric(rows, dai, ticket, share);
  }
  return sortRows(rows);
}

function addMetric(rows: Map<string, MetricRow>, label: string, ticket: Ticket, share = 1) {
  const row = rows.get(label) || { label, count: 0, xac: 0, win: 0, net: 0 };
  row.count += 1;
  row.xac += Number(ticket.xac || 0) * share;
  row.win += Number(ticket.tien_thang || 0) * share;
  row.net = row.win - row.xac;
  rows.set(label, row);
}

function sortRows(rows: Map<string, MetricRow>) {
  return [...rows.values()].sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}

function statusLabel(ticket: Ticket) {
  if (ticket.status === 'TRUNG' || Number(ticket.tien_thang || 0) > 0) return 'Trúng';
  if (ticket.status === 'Truot') return 'Trượt';
  return 'Chưa có KQ';
}

function money(value: number) {
  return Math.round(Number(value || 0)).toLocaleString('vi-VN');
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
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

function regionName(region: RegionScope) {
  return REGIONS.find(item => item.id === region)?.label || region;
}
