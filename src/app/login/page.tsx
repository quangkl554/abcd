import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="login-panel">
        <div>
          <p className="eyebrow">Xoso Web</p>
          <h1>Đăng nhập</h1>
          <p className="muted">Chỉ tài khoản được admin tạo mới vào được hệ thống.</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
