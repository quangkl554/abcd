'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { Calculator, Download, ExternalLink, FileText, RefreshCw, Save } from 'lucide-react';
import { AppHeader } from './app-header';

type Region = 'nam' | 'trung' | 'bac';

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
    activeDai: string[];
    resultSourceUrl: string;
  };
  drawResults: DrawResult[];
  tickets: Array<{ id: string; status: string; tien_thang: number; xac: number }>;
  summary: Array<{ playerName: string; soVe: number; tongXac: number; tongTrung: number; laiLo: number }>;
};

const REGIONS: Array<{ id: Region; label: string; short: string }> = [
  { id: 'nam', label: 'Miền Nam', short: 'Nam' },
  { id: 'trung', label: 'Miền Trung', short: 'Trung' },
  { id: 'bac', label: 'Miền Bắc', short: 'Bắc' },
];

const PASTE_HINTS: Record<Region, string[]> = {
  nam: [
    'Dòng đầu nên có tên đài, ví dụ: Bến Tre Vũng Tàu Bạc Liêu.',
    'Mỗi giải đặt nhãn riêng: ĐB, G1, G2, G3... rồi dán các số bên dưới.',
    'G3 có 2 số/đài, G4 có 7 số/đài, G6 có 3 số/đài; hệ thống tự chia theo thứ tự đài.',
  ],
  trung: [
    'Dòng đầu nên có tên đài, ví dụ: Đà Nẵng Khánh Hòa.',
    'Mỗi giải đặt nhãn riêng: ĐB, G1, G2, G3... rồi dán các số bên dưới.',
    'G3 có 2 số/đài, G4 có 7 số/đài, G6 có 3 số/đài; hệ thống tự chia theo thứ tự đài.',
  ],
  bac: [
    'Miền Bắc dùng một bảng số duy nhất.',
    'Có thể dán theo dạng: ĐB 12345, G1 12345, G2 12345 67890...',
    'G4/G5 là số 4 chữ số, G6 là 3 chữ số, G7 là 2 chữ số; hệ thống cắt theo độ dài giải.',
  ],
};

const SAMPLE_BY_REGION: Record<Region, string> = {
  nam: 'Bến Tre  Vũng Tàu  Bạc Liêu\nĐB\n123456\n234567\n345678\nG1\n12345\n23456\n34567\nG2\n12345\n23456\n34567',
  trung: 'Đà Nẵng  Khánh Hòa\nĐB\n123456\n234567\nG1\n12345\n23456\nG2\n12345\n23456',
  bac: 'ĐB 12345\nG1 23456\nG2 34567 45678\nG3 11111 22222 33333 44444 55555 66666\nG4 1234 2345 3456 4567\nG5 1111 2222 3333 4444 5555 6666\nG6 123 234 345\nG7 12 23 34 45',
};

export function ResultsPage() {
  const [date, setDate] = useState(todayKey());
  const [region, setRegion] = useState<Region>('nam');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [manualKq, setManualKq] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const totals = useMemo(() => {
    const tickets = workspace?.tickets || [];
    return {
      tickets: tickets.length,
      checked: tickets.filter(ticket => ticket.status !== 'Chua co KQ' && ticket.status !== '?').length,
      xac: tickets.reduce((sum, ticket) => sum + Number(ticket.xac || 0), 0),
      win: tickets.reduce((sum, ticket) => sum + Number(ticket.tien_thang || 0), 0),
    };
  }, [workspace]);

  useEffect(() => {
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, region]);

  async function loadWorkspace() {
    setError('');
    const response = await fetch(`/api/workspace?date=${date}&region=${region}`, { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setError(payload.error || 'Không tải được dữ liệu.');
      return;
    }
    setWorkspace(payload as Workspace);
  }

  async function fetchDraw() {
    setNotice('');
    setError('');
    startTransition(async () => {
      const response = await apiPost('/api/draw-results/fetch', { date, region });
      if (!response.ok) return setError(response.error);
      if (response.needsManual) {
        setNotice(`${response.reason} Hãy dán kết quả thủ công ở khung bên dưới.`);
      } else {
        setNotice('Đã tải và lưu kết quả tự động.');
        await loadWorkspace();
      }
    });
  }

  async function saveManualDraw() {
    if (!manualKq.trim()) return setError('Chưa có nội dung kết quả để lưu.');
    const response = await apiPost('/api/draw-results/manual', { date, region, text: manualKq });
    if (!response.ok) return setError(response.error);
    setManualKq('');
    setNotice('Đã lưu kết quả dán tay.');
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

  return (
    <main className="app-shell">
      <AppHeader username={workspace?.profile?.username} role={workspace?.profile?.role} activePage="results" />

      <div className="workspace results-workspace">
        <div className="main-flow">
          <section className="control-panel">
            <div className="date-control">
              <span>Ngày kết quả</span>
              <input type="date" value={date} onChange={event => setDate(event.target.value)} />
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
              <Link className="btn soft" href="/app"><FileText size={17} /> Bảng vé</Link>
              <button className="btn green" type="button" onClick={checkAll} disabled={pending}><Calculator size={17} /> Dò kết quả</button>
            </div>
          </section>

          {notice ? <div className="notice">{notice}</div> : null}
          {error ? <div className="error">{error}</div> : null}

          <section className="summary-grid">
            <div className="metric"><span>Vé</span><strong>{totals.tickets}</strong></div>
            <div className="metric"><span>Đã dò</span><strong>{totals.checked}</strong></div>
            <div className="metric"><span>Tổng xác</span><strong>{money(totals.xac)}</strong></div>
            <div className="metric"><span>Tổng thắng</span><strong>{money(totals.win)}</strong></div>
          </section>

          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title"><Download size={18} /> Tải kết quả tự động</h2>
                <p className="section-note">{workspace?.config.regionName} - Đài hôm nay: {workspace?.config.activeDai.join(', ') || 'chưa có'}</p>
              </div>
              <button className="btn primary" type="button" onClick={fetchDraw} disabled={pending}><RefreshCw size={17} /> Tải tự động</button>
            </div>
            <div className="source-box">
              <div>
                <span>Nguồn đang dùng</span>
                <a href={workspace?.config.resultSourceUrl || '#'} target="_blank" rel="noreferrer">
                  {workspace?.config.resultSourceUrl || 'Chưa cấu hình'} <ExternalLink size={14} />
                </a>
              </div>
              <p>Hệ thống ưu tiên lấy từ URL này. Nếu nguồn đổi cấu trúc hoặc thiếu giải, dùng khung dán tay bên dưới.</p>
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title"><Save size={18} /> Dán kết quả thủ công</h2>
                <p className="section-note">Format bám theo 3 file HTML cũ: nhận tên đài, nhãn giải và số theo từng dòng.</p>
              </div>
              <button className="btn primary" type="button" onClick={saveManualDraw}><Save size={17} /> Lưu dán tay</button>
            </div>
            <textarea
              className="textarea kq-input"
              value={manualKq}
              onChange={event => setManualKq(event.target.value)}
              placeholder={SAMPLE_BY_REGION[region]}
            />
          </section>

          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Kết quả đã lưu</h2>
              <span className="muted">{workspace?.drawResults.length || 0} đài</span>
            </div>
            <div className="draw-grid">
              {(workspace?.drawResults || []).map(draw => (
                <div className="draw-station" key={draw.id}>
                  <div className="draw-title">
                    <h3>{draw.dai}</h3>
                    <span>{draw.source === 'manual_text' ? 'Dán tay' : 'Tự động'}</span>
                  </div>
                  <div className="draw-lines">
                    {Object.entries(draw.prizes).map(([key, values]) => (
                      <div key={key}><b>{key.toUpperCase()}</b><span>{values.join(', ')}</span></div>
                    ))}
                  </div>
                </div>
              ))}
              {!workspace?.drawResults.length ? <div className="empty-state">Chưa có kết quả lưu cho ngày/miền này.</div> : null}
            </div>
          </section>
        </div>

        <aside className="sidebar-flow">
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Format dán tay</h2>
            </div>
            <div className="hint-list">
              {PASTE_HINTS[region].map(item => <div key={item}>{item}</div>)}
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Tổng theo khách</h2>
            </div>
            <div className="summary-list">
              {(workspace?.summary || []).map(row => (
                <div className="summary-row" key={row.playerName}>
                  <span>{row.playerName}</span>
                  <b className={row.laiLo >= 0 ? 'positive' : 'negative'}>{money(row.laiLo)}</b>
                  <small>{row.soVe} vé · xác {money(row.tongXac)} · thắng {money(row.tongTrung)}</small>
                </div>
              ))}
              {!workspace?.summary.length ? <div className="empty-state compact">Chưa có vé để tổng hợp.</div> : null}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
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

function money(value: number) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function todayKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
