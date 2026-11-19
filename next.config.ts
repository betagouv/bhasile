import type { NextConfig } from "next";

const shouldConfigureSentry =
  process.env.SENTRY_AUTH_TOKEN && process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.woff2$/,
      type: "asset/resource",
    });
    return config;
  },
  turbopack: {
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    proxyClientMaxBodySize: "30mb",
  },
  output: "standalone",
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.S3_URL!,
      },
    ],
  },
  ...(shouldConfigureSentry && {
    sentry: {
      org: "betagouv",
      project: "bhasile",
      sentryUrl: "https://sentry.incubateur.net/",
      silent: !process.env.CI,
      tunnelRoute: "/monitoring",
      webpack: {
        treeshake: {
          removeDebugLogging: true,
        },
      },
    },
  }),
};

export default nextConfig;
