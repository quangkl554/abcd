'use client';

import { useState, useTransition } from 'react';
import { LogIn } from 'lucide-react';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    startTransition(async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.error || 'Không đăng nhập được.');
        return;
      }
      window.location.href = '/app';
    });
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <label className="field">
        Tên đăng nhập
        <input className="input" value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" required />
      </label>
      <label className="field">
        Mật khẩu
        <input className="input" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required />
      </label>
      {error ? <div className="error">{error}</div> : null}
      <button className="btn primary" type="submit" disabled={pending}>
        <LogIn size={18} />
        {pending ? 'Đang vào...' : 'Đăng nhập'}
      </button>
    </form>
  );
}
