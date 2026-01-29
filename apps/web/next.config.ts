import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@apimon/shared", "@apimon/ui"],
};

export default nextConfig;
