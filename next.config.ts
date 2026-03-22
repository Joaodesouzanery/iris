import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["iris-core"],
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/app.html" },
      ],
    };
  },
};

export default nextConfig;
