import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["@apimon/shared", "@apimon/ui"],
  images: {
    unoptimized: true,
  },
  // For GitHub Pages deployment under /apimon path
  basePath: process.env.GITHUB_PAGES === "true" ? "/apimon" : "",
  assetPrefix: process.env.GITHUB_PAGES === "true" ? "/apimon/" : "",
};

export default nextConfig;
