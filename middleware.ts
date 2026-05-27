import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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
    .select('role, active')
    .eq('user_id', data.user.id)
    .single();

  if (!profile?.active) return redirectToLogin(request);
  if (request.nextUrl.pathname.startsWith('/admin') && profile.role !== 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/app';
    return NextResponse.redirect(url);
  }

  return response;
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/app/:path*', '/results/:path*', '/summary/:path*', '/admin/:path*'],
};
