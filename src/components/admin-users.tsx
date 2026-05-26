'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, Plus, RefreshCw, Save, Shield, UserRound } from 'lucide-react';

type AdminUser = {
  user_id: string;
  username: string;
  role: 'admin' | 'user';
  active: boolean;
  created_at: string;
};

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setError('');
    const response = await fetch('/api/admin/users', { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setError(payload.error || 'Khong tai duoc danh sach user.');
      return;
    }
    setUsers(payload.users || []);
  }

  function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    startTransition(async () => {
      const response = await api('/api/admin/users', 'POST', { username, password, role, active: true });
      if (!response.ok) return setError(response.error);
      setUsername('');
      setPassword('');
      setRole('user');
      setMessage('Đã tạo tài khoản.');
      await loadUsers();
    });
  }

  async function toggleUser(user: AdminUser) {
    const response = await api('/api/admin/users', 'PATCH', { userId: user.user_id, active: !user.active });
    if (!response.ok) return setError(response.error);
    await loadUsers();
  }

  async function changeRole(user: AdminUser, nextRole: 'admin' | 'user') {
    const response = await api('/api/admin/users', 'PATCH', { userId: user.user_id, role: nextRole });
    if (!response.ok) return setError(response.error);
    await loadUsers();
  }

  async function resetPassword(user: AdminUser) {
    const nextPassword = window.prompt(`Mật khẩu mới cho ${user.username} (ít nhất 8 ký tự)`);
    if (!nextPassword) return;
    const response = await api('/api/admin/users', 'PATCH', { userId: user.user_id, password: nextPassword });
    if (!response.ok) return setError(response.error);
    setMessage('Đã đổi mật khẩu.');
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Shield size={18} /></div>
          <div>
            <div>Quản trị tài khoản</div>
            <div className="muted" style={{ fontSize: 12 }}>Tạo và khóa người dùng được phép vào web</div>
          </div>
        </div>
        <div className="topbar-actions">
          <Link className="btn" href="/app"><ArrowLeft size={17} /> Về app</Link>
          <button className="btn" type="button" onClick={loadUsers}><RefreshCw size={17} /> Tải lại</button>
        </div>
      </header>

      <div className="workspace" style={{ gridTemplateColumns: '420px minmax(0, 1fr)' }}>
        <section className="section">
          <div className="section-header">
            <h1 className="section-title"><Plus size={18} /> Tạo tài khoản</h1>
          </div>
          {message ? <div className="notice">{message}</div> : null}
          {error ? <div className="error">{error}</div> : null}
          <form className="form-grid" onSubmit={createUser} style={{ marginTop: 12 }}>
            <label className="field">
              Username
              <input className="input" value={username} onChange={event => setUsername(event.target.value)} required minLength={3} />
            </label>
            <label className="field">
              Mật khẩu
              <input className="input" type="password" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} />
            </label>
            <label className="field">
              Quyền
              <select className="select" value={role} onChange={event => setRole(event.target.value as 'admin' | 'user')}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button className="btn primary" type="submit" disabled={pending}><Save size={17} /> Tạo user</button>
          </form>
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title"><UserRound size={18} /> Danh sách</h2>
            <span className="badge">{users.length}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Quyền</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.user_id}>
                    <td><b>{user.username}</b></td>
                    <td>
                      <select className="select" value={user.role} onChange={event => changeRole(user, event.target.value as 'admin' | 'user')}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{user.active ? <span className="badge win">Đang mở</span> : <span className="badge loss">Đã khóa</span>}</td>
                    <td>{new Date(user.created_at).toLocaleString('vi-VN')}</td>
                    <td>
                      <div className="row">
                        <button className="btn" type="button" onClick={() => resetPassword(user)}><Lock size={16} /> Mật khẩu</button>
                        <button className={`btn ${user.active ? 'red' : 'green'}`} type="button" onClick={() => toggleUser(user)}>
                          {user.active ? 'Khóa' : 'Mở'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

async function api(url: string, method: 'POST' | 'PATCH', body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  return { ok: response.ok && payload.ok, ...payload };
}
