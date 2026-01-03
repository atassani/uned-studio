import type { NextConfig } from "next";


const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'export',
  basePath,
  assetPrefix: basePath ? basePath + '/' : '',
};

export default nextConfig;
