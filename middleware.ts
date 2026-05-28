import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const XOSO_SESSION_COOKIE = 'xoso_session_id';

export async function middleware(request: NextRequest) {
  const protectedPath = ['/app', '/results', '/summary', '/admin'].some(path => request.nextUrl.pathname.startsWith(path));
  if (!protectedPath) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  if (!data.user) return redirectToLogin(request);

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', data.user.id)
    .single();

  if (!profile?.active) return redirectToLogin(request);
  const sessionId = request.cookies.get(XOSO_SESSION_COOKIE)?.value || null;
  if (profile.active_session_id && profile.active_session_id !== sessionId) {
    return redirectToLogin(request, 'session-replaced');
  }
  if (request.nextUrl.pathname.startsWith('/admin') && profile.role !== 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/app';
    return NextResponse.redirect(url);
  }

  return response;
}

function redirectToLogin(request: NextRequest, reason?: string) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', request.nextUrl.pathname);
  if (reason) url.searchParams.set('reason', reason);
  const response = NextResponse.redirect(url);
  if (reason === 'session-replaced') response.cookies.set(XOSO_SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}

export const config = {
  matcher: ['/app/:path*', '/results/:path*', '/summary/:path*', '/admin/:path*'],
};
