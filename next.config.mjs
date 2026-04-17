import { Buffer } from 'node:buffer';

// Polyfill File for Node.js 18 (needed by undici used in expo-server-sdk)
if (typeof globalThis.File === 'undefined') {
  globalThis.File = class File extends Blob {
    #name;
    #lastModified;
    constructor(chunks, name, options = {}) {
      super(chunks, options);
      this.#name = name;
      this.#lastModified = options.lastModified ?? Date.now();
    }
    get name() { return this.#name; }
    get lastModified() { return this.#lastModified; }
    get [Symbol.toStringTag]() { return 'File'; }
  };
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['expo-server-sdk'],
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      // Catch-all for /wp-admin paths - redirect to dashboard
      {
        source: '/wp-admin/:path*',
        destination: '/dashboard',
        permanent: false, // 302 redirect - NextAuth will handle auth
      },
    ];
  },
};

export default nextConfig;
