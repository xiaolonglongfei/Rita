import type { NextConfig } from "next";

// Print at server startup so we can verify the Supabase URL is correct
console.log("[Rita startup] NEXT_PUBLIC_SUPABASE_URL =", process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(not set)");
console.log("[Rita startup] NEXT_PUBLIC_APP_URL      =", process.env.NEXT_PUBLIC_APP_URL ?? "(not set)");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.worf.replit.dev", "*.replit.dev", "*.repl.co"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
