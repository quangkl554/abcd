'use client';

import Link from 'next/link';
import { BarChart3, FileText, ListChecks, LogOut, Moon, Settings, Sun, Tickets, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';

type AppHeaderProps = {
  username?: string;
  role?: 'admin' | 'user';
  activePage: 'tickets' | 'results' | 'summary';
};

export function AppHeader({ username, role, activePage }: AppHeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = window.localStorage.getItem('xoso-theme');
    const initial = saved === 'dark' || saved === 'light'
      ? saved
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem('xoso-theme', next);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark"><Tickets size={22} /></div>
        <div>
          <div className="brand-title">Sổ số tự động</div>
          <div className="brand-subtitle">Nhập vé · Dò kết quả · Tổng hợp lãi lỗ</div>
        </div>
      </div>

      <nav className="page-tabs" aria-label="Điều hướng chính">
        <Link className={`page-tab ${activePage === 'tickets' ? 'active' : ''}`} href="/app"><FileText size={16} /> Vé</Link>
        <Link className={`page-tab ${activePage === 'results' ? 'active' : ''}`} href="/results"><ListChecks size={16} /> Kết quả</Link>
        <Link className={`page-tab ${activePage === 'summary' ? 'active' : ''}`} href="/summary"><BarChart3 size={16} /> Tổng hợp</Link>
      </nav>

      <div className="topbar-actions">
        <button className="btn icon soft" type="button" title={theme === 'dark' ? 'Chuyển nền sáng' : 'Chuyển nền tối'} onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <span className="badge user"><UserRound size={14} /> {username || 'user'}</span>
        {role === 'admin' ? <Link className="btn soft" href="/admin"><Settings size={17} /> Tạo user</Link> : null}
        <button className="btn icon soft" type="button" title="Đăng xuất" onClick={logout}><LogOut size={18} /></button>
      </div>
    </header>
  );
}
