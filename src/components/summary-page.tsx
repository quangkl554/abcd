'use client';

import Link from 'next/link';
import { type ReactNode, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileText,
  ListChecks,
  RefreshCw,
  Trophy,
  UsersRound,
} from 'lucide-react';
import { useWorkspaceData } from '@/lib/use-workspace-data';
import { AppHeader } from './app-header';

type Region = 'nam' | 'trung' | 'bac';

type Ticket = {
  id: string;
  player_name: string;
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
    region: Region;
    regionName: string;
    activeDai: string[];
  };
  tickets: Ticket[];
  drawResults: Array<{ id: string; dai: string }>;
  summary: Array<{ playerName: string; soVe: number; tongXac: number; tongTrung: number; laiLo: number }>;
};

type MetricRow = {
  label: string;
  count: number;
  xac: number;
  win: number;
  net: number;
};

const REGIONS: Array<{ id: Region; label: string; short: string }> = [
  { id: 'nam', label: 'Miền Nam', short: 'Nam' },
  { id: 'trung', label: 'Miền Trung', short: 'Trung' },
  { id: 'bac', label: 'Miền Bắc', short: 'Bắc' },
];

export function SummaryPage() {
  const [date, setDate] = useState(todayKey());
  const [region, setRegion] = useState<Region>('nam');
  const { workspace, loading, error, loadWorkspace } = useWorkspaceData<Workspace>(date, region);

  const tickets = workspace?.tickets || [];
  const totals = useMemo(() => ({
    tickets: tickets.length,
    xac: tickets.reduce((sum, ticket) => sum + Number(ticket.xac || 0), 0),
    win: tickets.reduce((sum, ticket) => sum + Number(ticket.tien_thang || 0), 0),
    checked: tickets.filter(ticket => statusLabel(ticket) !== 'Chưa có KQ').length,
  }), [tickets]);
  const byType = useMemo(() => groupTickets(tickets, ticket => ticket.loai_label || ticket.loai || 'Chưa rõ'), [tickets]);
  const byDai = useMemo(() => groupByDai(tickets), [tickets]);
  const byStatus = useMemo(() => groupTickets(tickets, statusLabel), [tickets]);

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
              <span className="badge neutral">{workspace?.summary.length || 0} khách</span>
            </div>
            <div className="summary-table">
              <div className="summary-table-head">
                <span>Khách</span><span>Vé</span><span>Xác</span><span>Thắng</span><span>Lãi lỗ</span>
              </div>
              {(workspace?.summary || []).map(row => (
                <div className="summary-table-row" key={row.playerName}>
                  <b>{row.playerName}</b>
                  <span>{row.soVe}</span>
                  <span>{money(row.tongXac)}</span>
                  <span>{money(row.tongTrung)}</span>
                  <strong className={row.laiLo >= 0 ? 'positive' : 'negative'}>{money(row.laiLo)}</strong>
                </div>
              ))}
              {!workspace?.summary.length ? <div className="empty-state compact">Chưa có vé để tổng hợp.</div> : null}
            </div>
          </section>

          <div className="analytics-grid">
            <StatsSection title="Theo loại vé" icon={<BarChart3 size={18} />} rows={byType} />
            <StatsSection title="Theo đài" icon={<CircleDollarSign size={18} />} rows={byDai} />
            <StatsSection title="Trạng thái dò" icon={<Trophy size={18} />} rows={byStatus} />
            <section className="section">
              <div className="section-header">
                <h2 className="section-title"><BarChart3 size={18} /> Chỉ số mở rộng</h2>
              </div>
              <div className="empty-state compact">Chưa cấu hình thống kê nâng cao.</div>
            </section>
          </div>
        </div>
      </div>
    </main>
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
