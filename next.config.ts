import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16'da React Compiler artık ana dizinde tanımlanıyor
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.tabiristan.com', 
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;