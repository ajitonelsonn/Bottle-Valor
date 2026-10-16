import path from "node:path";
import type { NextConfig } from "next";

const root = path.resolve(__dirname);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle for the Cloud Run container.
  output: "standalone",
  // Pin the workspace root so a lockfile elsewhere on the machine isn't picked up.
  outputFileTracingRoot: root,
  turbopack: { root },
  poweredByHeader: false,
  images: {
    qualities: [75, 90],
    // Public catalogue images (bins, rewards) are served from Cloud Storage.
    remotePatterns: [{ protocol: "https", hostname: "storage.googleapis.com", pathname: "/botlevalor-public/**" }],
  },
};

export default nextConfig;
