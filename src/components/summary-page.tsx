'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
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

type Workspace = {
  profile: { username: string; role: 'admin' | 'user' };
  config: {
    region: RegionScope;
    regionName: string;
    activeDai: string[];
  };
  players: Player[];
  totals: TicketTotals;
  summary: PlayerSummaryRow[];
  topPlayers: PlayerSummaryRow[];
  byDai?: MetricRow[];
  byRegion: MetricRow[];
};

type DetailsWorkspace = {
  byDai: MetricRow[];
  byStatus: MetricRow[];
  byType: MetricRow[];
};

type TicketTotals = {
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
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const dashboardRef = useRef<HTMLDivElement | null>(null);
  const workspaceParams = useMemo(() => (
    selectedPlayerId === 'all' ? { section: 'overview' } : { section: 'overview', playerId: selectedPlayerId }
  ), [selectedPlayerId]);
  const { workspace, loading, error, loadWorkspace } = useWorkspaceData<Workspace>(date, region, {
    endpoint: 'summary',
    params: workspaceParams,
  });
  const detailsParams = useMemo(() => (
    selectedPlayerId === 'all' ? { section: 'details' } : { section: 'details', playerId: selectedPlayerId }
  ), [selectedPlayerId]);
  const { workspace: details, loading: detailsLoading, loadWorkspace: loadDetails } = useWorkspaceData<DetailsWorkspace>(date, region, {
    endpoint: 'summary',
    params: detailsParams,
    enabled: dashboardVisible,
  });

  const summaryRows = workspace?.summary || [];
  const totals = workspace?.totals || emptyTotals();
  const byDai = details?.byDai || [];
  const byRegion = workspace?.byRegion || [];
  const byStatus = details?.byStatus || [];
  const byType = details?.byType || [];
  const topPlayers = workspace?.topPlayers || [];
  const visualRows = region === 'all' ? byRegion : byDai;
  const maxVisualXac = useMemo(() => Math.max(1, ...visualRows.map(row => row.xac)), [visualRows]);
  const conclusion = useMemo(() => buildConclusion(totals, region, visualRows, byType, detailsLoading), [byType, detailsLoading, region, totals, visualRows]);
  const dashboardMetrics = useMemo<DashboardMetric[]>(() => {
    return region === 'all'
      ? buildDailyDashboardMetrics(totals, byRegion)
      : buildRegionDashboardMetrics(totals, byDai);
  }, [byDai, byRegion, region, totals]);

  useEffect(() => {
    if (selectedPlayerId === 'all') return;
    if (!workspace) return;
    if (!workspace?.players.some(player => player.id === selectedPlayerId)) {
      setSelectedPlayerId('all');
    }
  }, [selectedPlayerId, workspace?.players]);

  useEffect(() => {
    if (dashboardVisible) return;
    const node = dashboardRef.current;
    if (!node || !('IntersectionObserver' in window)) {
      setDashboardVisible(true);
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setDashboardVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '220px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [dashboardVisible]);

  function refreshSummary() {
    void loadWorkspace({ force: true });
    if (dashboardVisible) void loadDetails({ force: true });
  }

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
              <button className="btn soft" type="button" onClick={refreshSummary}><RefreshCw size={17} className={loading || detailsLoading ? 'spin' : ''} /> Tải lại</button>
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

          <div className="dashboard-grid" ref={dashboardRef}>
            <section className="section dashboard-overview">
              <div className="section-header">
                <div>
                  <h2 className="section-title"><BarChart3 size={18} /> {region === 'all' ? 'Dashboard cả ngày' : `Dashboard ${regionName(region)}`}</h2>
                  <p className="section-note">{region === 'all' ? 'Tổng kết toàn bộ Nam, Trung, Bắc trong ngày và khách đang chọn.' : 'Thống kê riêng cho miền và khách đang chọn.'}</p>
                </div>
                {detailsLoading ? <span className="loading-chip inline"><RefreshCw size={14} className="spin" /> Đang tải chi tiết</span> : null}
              </div>
              <div className="dashboard-card-grid">
                {dashboardMetrics.map(metric => <DashboardCard metric={metric} key={metric.label} />)}
              </div>
              <InsightStrip text={conclusion} />
            </section>
            <VisualBarSection title={region === 'all' ? 'Phân bổ theo miền' : 'Phân bổ theo đài'} icon={<CircleDollarSign size={18} />} rows={visualRows} maxXac={maxVisualXac} />
            <StatsSection title={region === 'all' ? 'Trạng thái cả ngày' : 'Loại vé nổi bật'} icon={region === 'all' ? <Trophy size={18} /> : <Target size={18} />} rows={region === 'all' ? byStatus : byType} />
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

function InsightStrip({ text }: { text: string }) {
  return (
    <div className="dashboard-insight">
      <b>Kết luận nhanh</b>
      <span>{text}</span>
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

function buildDailyDashboardMetrics(totals: TicketTotals, byRegion: MetricRow[]): DashboardMetric[] {
  const highestXacRegion = topBy(byRegion, row => row.xac);
  const netRate = totals.xac ? Math.round((totals.net / totals.xac) * 100) : 0;
  return [
    { label: 'Biên lãi/lỗ', value: `${netRate}%`, detail: money(totals.net), tone: totals.net >= 0 ? 'green' : 'amber', icon: <Gauge size={18} />, percent: Math.abs(netRate) },
    { label: 'Tỷ lệ trả', value: `${totals.payoutRate}%`, detail: `${money(totals.win)} / ${money(totals.xac)}`, tone: 'teal', icon: <TrendingUp size={18} />, percent: Math.min(totals.payoutRate, 100) },
    { label: 'Tỷ lệ trúng', value: `${totals.hitRate}%`, detail: `${totals.hitCount}/${totals.checked || totals.tickets} vé đã dò`, tone: 'green', icon: <Target size={18} />, percent: totals.hitRate },
    { label: 'Miền nhiều xác', value: highestXacRegion?.label || '-', detail: highestXacRegion ? `${money(highestXacRegion.xac)} · ${percentOf(highestXacRegion.xac, totals.xac)}%` : 'chưa có dữ liệu', tone: 'blue', icon: <Activity size={18} />, percent: percentOf(highestXacRegion?.xac || 0, totals.xac) },
  ];
}

function buildRegionDashboardMetrics(totals: TicketTotals, byDai: MetricRow[]): DashboardMetric[] {
  const highestXacDai = topBy(byDai, row => row.xac);
  const netRate = totals.xac ? Math.round((totals.net / totals.xac) * 100) : 0;
  return [
    { label: 'Biên lãi/lỗ', value: `${netRate}%`, detail: money(totals.net), tone: totals.net >= 0 ? 'green' : 'amber', icon: <Gauge size={18} />, percent: Math.abs(netRate) },
    { label: 'Tỷ lệ trả', value: `${totals.payoutRate}%`, detail: `${money(totals.win)} / ${money(totals.xac)}`, tone: 'teal', icon: <TrendingUp size={18} />, percent: Math.min(totals.payoutRate, 100) },
    { label: 'Tỷ lệ trúng', value: `${totals.hitRate}%`, detail: `${totals.hitCount}/${totals.checked || totals.tickets} vé đã dò`, tone: 'green', icon: <Target size={18} />, percent: totals.hitRate },
    { label: 'Đài nhiều xác', value: highestXacDai?.label || '-', detail: highestXacDai ? `${money(highestXacDai.xac)} · ${percentOf(highestXacDai.xac, totals.xac)}%` : 'đang tải chi tiết', tone: 'blue', icon: <Activity size={18} />, percent: percentOf(highestXacDai?.xac || 0, totals.xac) },
  ];
}

function buildConclusion(totals: TicketTotals, region: RegionScope, visualRows: MetricRow[], byType: MetricRow[], detailsLoading: boolean) {
  if (!totals.tickets) return 'Chưa có vé trong phạm vi đang chọn.';
  const netWord = totals.net >= 0 ? 'lãi' : 'âm';
  const netRate = totals.xac ? Math.round((totals.net / totals.xac) * 100) : 0;
  const strongestArea = topBy(visualRows, row => row.xac);
  const topType = topBy(byType, row => row.xac);
  const areaText = strongestArea
    ? `${region === 'all' ? 'Miền' : 'Đài'} tập trung xác nhiều nhất là ${strongestArea.label} (${money(strongestArea.xac)}, ${percentOf(strongestArea.xac, totals.xac)}%).`
    : detailsLoading ? 'Đang tải phân bổ chi tiết.' : 'Chưa có phân bổ chi tiết.';
  const typeText = region !== 'all' && topType ? ` Loại vé nặng nhất là ${topType.label} (${money(topType.xac)}).` : '';
  return `Phạm vi này đang ${netWord} ${money(Math.abs(totals.net))} (${netRate}%). Tỷ lệ trả ${totals.payoutRate}%, trúng ${totals.hitCount}/${totals.checked || totals.tickets} vé đã dò. ${areaText}${typeText}`;
}

function emptyTotals(): TicketTotals {
  return {
    tickets: 0,
    checked: 0,
    hitCount: 0,
    xac: 0,
    win: 0,
    net: 0,
    averageXac: 0,
    checkedRate: 0,
    hitRate: 0,
    payoutRate: 0,
  };
}

function topBy<T>(rows: T[], getValue: (row: T) => number) {
  return rows.reduce<T | undefined>((best, row) => {
    if (!best || getValue(row) > getValue(best)) return row;
    return best;
  }, undefined);
}

function percentOf(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
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
