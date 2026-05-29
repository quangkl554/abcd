import { LoginForm } from '@/components/login-form';

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const reason = firstValue(params.reason);
  const nextPath = safeNextPath(firstValue(params.next));
  const notice = reason === 'session-replaced'
    ? 'Tài khoản này vừa đăng nhập ở nơi khác, phiên cũ đã được khóa.'
    : '';

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div>
          <p className="eyebrow">Hệ thống tự động số</p>
          <h1>Đăng nhập</h1>
          <p className="muted">Chỉ tài khoản được admin tạo mới vào được hệ thống. Mỗi tài khoản chỉ hoạt động ở một nơi tại một thời điểm.</p>
        </div>
        <LoginForm notice={notice} nextPath={nextPath} />
      </section>
    </main>
  );
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeNextPath(value: string | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/app';
  return value;
}
