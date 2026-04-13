import { NextRequest, NextResponse } from 'next/server';

const MAX_BODY_SIZE = 1_048_576; // 1MB

export function middleware(req: NextRequest) {
  // Only apply to API routes
  if (!req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return NextResponse.next();
  }

  // Block non-POST methods on API routes (all app API routes are POST-only)
  if (req.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  // ── Origin / CSRF check ──
  // Reject cross-origin requests that don't match the app's own origin.
  // Browsers always send Origin on POST. If missing, check Referer.
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { error: 'Cross-origin requests are not allowed' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid origin header' },
        { status: 403 }
      );
    }
  }

  // Block oversized payloads via Content-Length header
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: 'Payload too large. Maximum size is 1MB.' },
      { status: 413 }
    );
  }

  // Reject chunked requests without Content-Length (bypass prevention)
  if (!contentLength) {
    const transferEncoding = req.headers.get('transfer-encoding');
    if (transferEncoding?.includes('chunked')) {
      return NextResponse.json(
        { error: 'Content-Length header is required' },
        { status: 411 }
      );
    }
  }

  // Require JSON content type for POST requests
  const contentType = req.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return NextResponse.json(
      { error: 'Content-Type must be application/json' },
      { status: 415 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
