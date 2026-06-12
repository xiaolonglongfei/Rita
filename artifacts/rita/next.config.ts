import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.worf.replit.dev", "*.replit.dev", "*.repl.co"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
