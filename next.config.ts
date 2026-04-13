import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Note: swcMinify is enabled by default in Next.js 15+, no need to specify
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Silence workspace root warning
  outputFileTracingRoot: process.cwd(),
  // Fix for: "Body exceeded 1 MB limit" in Server Actions
  // For Next.js 15.5.6, serverActions should be under experimental
  experimental: {
    serverActions: {
      // Increase the body size limit (default is 1MB)
      bodySizeLimit: "50mb", // Allows file uploads up to 50 MB
      // Increase timeout for long-running actions (default is 30s)
      allowedOrigins: ["localhost:3002", "localhost:3000"],
    },
  },
  // Webpack configuration to handle CommonJS modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle CommonJS modules on the server
      config.externals = config.externals || [];
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
} satisfies NextConfig;

export default nextConfig;

