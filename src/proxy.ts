import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'th'];
const defaultLocale = 'en';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname has a locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Read preferred locale from NEXT_LOCALE cookie
  let locale = request.cookies.get('NEXT_LOCALE')?.value;
  if (!locale || !locales.includes(locale)) {
    // Fall back to Accept-Language header
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage && acceptLanguage.toLowerCase().includes('th')) {
      locale = 'th';
    } else {
      locale = defaultLocale;
    }
  }

  // Redirect to localized URL path
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Skip all API routes, internal dev server assets, favicon, and standard image/file resources
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.ico|.*\\.svg|.*\\.webp|.*\\.css|.*\\.js).*)',
  ],
};
