import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  // 2. Resim İzin Ayarı (Bu da kalıyor)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // DİKKAT: Buraya yeni R2 adresini (pub-xxx veya cdn.tabiristan.com) yazacaksın
        hostname: 'cdn.tabiristan.com', 
        port: '',
        pathname: '/**',
      },
    ],
  },
    reactCompiler: true,
  };


export default nextConfig;


