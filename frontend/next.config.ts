import type { NextConfig } from 'next';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  ...(process.env.NODE_ENV === 'production' ? { output: 'export' as const } : {}),
  basePath,
  trailingSlash: true,
  assetPrefix: basePath ? basePath + '/' : '',
};

export default nextConfig;
