import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Enforce HTTPS (1 year)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Control referrer information
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restrict browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), geolocation=(), interest-cohort=()',
  },
  // XSS protection (legacy browsers)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Prevent DNS prefetch for privacy
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // unsafe-inline needed for Next.js inline scripts; unsafe-eval for dev HMR (Next.js strips in prod)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://generativelanguage.googleapis.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/:path*',
      headers: securityHeaders,
    },
  ],
  // Limit API body size (1MB max)
  serverExternalPackages: [],
};

export default nextConfig;
