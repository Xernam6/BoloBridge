/**
 * In-memory sliding-window rate limiter for API routes.
 * No external dependencies. Works on Vercel serverless (per-instance).
 *
 * Usage:
 *   const result = rateLimit(req, { maxRequests: 5, windowMs: 15 * 60 * 1000 });
 *   if (!result.ok) return result.response;
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitOptions {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Identifier prefix (e.g., 'chat', 'auth') for per-route limits */
  prefix?: string;
}

// In-memory store. Resets on cold start (serverless), which is acceptable
// as a first layer. For production at scale, swap with Redis/Upstash.
const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks (every 60s)
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

function getClientFingerprint(req: NextRequest): string {
  // Use the rightmost X-Forwarded-For IP (set by the trusted edge proxy)
  // to resist spoofing. Attackers can prepend fake IPs but not modify
  // the IP appended by the load balancer.
  const xff = req.headers.get('x-forwarded-for');
  const ip = xff
    ? xff.split(',').pop()?.trim() || 'unknown'
    : req.headers.get('x-real-ip') || 'unknown';

  // Combine IP with user-agent for a slightly stronger fingerprint
  const ua = req.headers.get('user-agent') || '';
  return `${ip}::${ua.slice(0, 64)}`;
}

export function rateLimit(
  req: NextRequest,
  options: RateLimitOptions
): { ok: true } | { ok: false; response: NextResponse } {
  const { maxRequests, windowMs, prefix = 'global' } = options;
  const fingerprint = getClientFingerprint(req);
  const key = `${prefix}:${fingerprint}`;
  const now = Date.now();

  cleanup(windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    const retryAfterMs = entry.timestamps[0] + windowMs - now;
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);

    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: retryAfterSec,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil((entry.timestamps[0] + windowMs) / 1000)),
          },
        }
      ),
    };
  }

  entry.timestamps.push(now);

  return { ok: true };
}
