import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/nasty-1",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
