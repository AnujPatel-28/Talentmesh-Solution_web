import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DEV_COOKIE = 'tm_dev_access';
const DEV_SECRET = process.env.DEV_ACCESS_KEY || '';

export function proxy(request: NextRequest) {
    // ──────────────────────────────────────────────
    // Route protection is DISABLED for now.
    // To re‑enable, uncomment the block below.
    // ──────────────────────────────────────────────
    return NextResponse.next();

    /*
    const { pathname } = request.nextUrl;

    if (pathname === '/dev-access') {
        const key = request.nextUrl.searchParams.get('key');
        if (key === DEV_SECRET) {
            const response = NextResponse.redirect(new URL('/dashboard/candidate', request.url));
            response.cookies.set(DEV_COOKIE, 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30,
                path: '/',
            });
            return response;
        }
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
        const hasCookie = request.cookies.get(DEV_COOKIE)?.value === 'true';
        if (!hasCookie) {
            return NextResponse.redirect(new URL('/under-construction', request.url));
        }
    }

    return NextResponse.next();
    */
}

export const config = {
    matcher: ['/dashboard/:path*', '/onboarding/:path*', '/dev-access'],
};
