'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, KeyRound, Lock, Plus, RefreshCw, Save, Shield, Trash2, UserRound, XCircle } from 'lucide-react';

type AdminUser = {
  user_id: string;
  username: string;
  role: 'admin' | 'user';
  active: boolean;
  created_at: string;
};

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
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
      setError(payload.error || 'Không tải được danh sách user.');
      return;
    }
    setUsers(payload.users || []);
    setCurrentUserId(payload.currentUserId || '');
  }

  function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password !== passwordConfirm) {
      setError('Mật khẩu nhập lại chưa khớp.');
      return;
    }
    startTransition(async () => {
      const response = await api('/api/admin/users', 'POST', { username, password, role, active: true });
      if (!response.ok) return setError(response.error);
      setUsername('');
      setPassword('');
      setPasswordConfirm('');
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
    setResetTarget(user);
    setResetPasswordValue('');
    setResetPasswordConfirm('');
    setError('');
    setMessage('');
  }

  async function submitResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetTarget) return;
    if (resetPasswordValue !== resetPasswordConfirm) return setError('Mật khẩu nhập lại chưa khớp.');
    const response = await api('/api/admin/users', 'PATCH', { userId: resetTarget.user_id, password: resetPasswordValue });
    if (!response.ok) return setError(response.error);
    setResetTarget(null);
    setResetPasswordValue('');
    setResetPasswordConfirm('');
    setMessage('Đã đổi mật khẩu.');
  }

  function openDeleteUser(user: AdminUser) {
    setDeleteTarget(user);
    setDeleteConfirm('');
    setError('');
    setMessage('');
  }

  async function submitDeleteUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deleteTarget) return;
    if (deleteConfirm.trim().toLowerCase() !== deleteTarget.username.toLowerCase()) {
      return setError('Bạn cần gõ đúng username để xác nhận xóa.');
    }
    const response = await api('/api/admin/users', 'DELETE', {
      userId: deleteTarget.user_id,
      confirmUsername: deleteConfirm,
    });
    if (!response.ok) return setError(response.error);
    setMessage(`Đã xóa user ${deleteTarget.username}.`);
    setDeleteTarget(null);
    setDeleteConfirm('');
    await loadUsers();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Shield size={18} /></div>
          <div>
            <div className="brand-title">Quản trị truy cập</div>
            <div className="brand-subtitle">Tạo, khóa, đổi mật khẩu và xóa user</div>
          </div>
        </div>
        <div className="topbar-actions">
          <Link className="btn" href="/app"><ArrowLeft size={17} /> Về app</Link>
          <button className="btn" type="button" onClick={loadUsers}><RefreshCw size={17} /> Tải lại</button>
        </div>
      </header>

      <div className="workspace admin-workspace">
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
              Nhập lại mật khẩu
              <input className="input" type="password" value={passwordConfirm} onChange={event => setPasswordConfirm(event.target.value)} required minLength={8} />
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
                        <button className="btn" type="button" onClick={() => resetPassword(user)}><KeyRound size={16} /> Mật khẩu</button>
                        <button className={`btn ${user.active ? 'red' : 'green'}`} type="button" onClick={() => toggleUser(user)}>
                          {user.active ? 'Khóa' : 'Mở'}
                        </button>
                        <button
                          className="btn danger-soft"
                          type="button"
                          disabled={user.user_id === currentUserId}
                          title={user.user_id === currentUserId ? 'Không thể xóa tài khoản đang đăng nhập' : 'Xóa user'}
                          onClick={() => openDeleteUser(user)}
                        >
                          <Trash2 size={16} /> Xóa
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

      {resetTarget ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal-panel" onSubmit={submitResetPassword}>
            <div className="modal-head">
              <div>
                <h2><Lock size={18} /> Đổi mật khẩu</h2>
                <p>User: <b>{resetTarget.username}</b></p>
              </div>
              <button className="btn icon soft" type="button" onClick={() => setResetTarget(null)} title="Đóng"><XCircle size={18} /></button>
            </div>
            <label className="field">
              Mật khẩu mới
              <input className="input" type="password" value={resetPasswordValue} onChange={event => setResetPasswordValue(event.target.value)} required minLength={8} autoFocus />
            </label>
            <label className="field">
              Nhập lại mật khẩu mới
              <input className="input" type="password" value={resetPasswordConfirm} onChange={event => setResetPasswordConfirm(event.target.value)} required minLength={8} />
            </label>
            <div className="row action-row">
              <button className="btn primary" type="submit"><Save size={16} /> Lưu mật khẩu</button>
              <button className="btn soft" type="button" onClick={() => setResetTarget(null)}>Hủy</button>
            </div>
          </form>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal-panel danger-modal" onSubmit={submitDeleteUser}>
            <div className="modal-head">
              <div>
                <h2><AlertTriangle size={18} /> Xóa user</h2>
                <p>Gõ đúng <b>{deleteTarget.username}</b> để xác nhận.</p>
              </div>
              <button className="btn icon soft" type="button" onClick={() => setDeleteTarget(null)} title="Đóng"><XCircle size={18} /></button>
            </div>
            <label className="field">
              Username xác nhận
              <input className="input" value={deleteConfirm} onChange={event => setDeleteConfirm(event.target.value)} required autoFocus />
            </label>
            <div className="row action-row">
              <button className="btn red" type="submit"><Trash2 size={16} /> Xóa user</button>
              <button className="btn soft" type="button" onClick={() => setDeleteTarget(null)}>Hủy</button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

async function api(url: string, method: 'POST' | 'PATCH' | 'DELETE', body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  return { ok: response.ok && payload.ok, ...payload };
}
