import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dratbz8bh/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://fitupproject.onrender.com/api/:path*",
      },
      {
        source: "/auth/:path*",
        destination: "https://fitupproject.onrender.com/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
