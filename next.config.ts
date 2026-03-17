import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/projects",
        destination: "/reports",
        permanent: true,
      },
      {
        source: "/projects/:id",
        destination: "/reports",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
