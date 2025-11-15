/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io"
      },
      {
        protocol: "https",
        hostname: "cdn.studioatlas.com"
      },
      {
        protocol: "https",
        hostname: "images.pexels.com"
      },
      {
        protocol: "https",
        hostname: "pub-6a547a255de44eb695526ad8f771de1f.r2.dev"
      },
      {
        protocol: "https",
        hostname: "60379d0ecea0a318a914ed4d5da4588d.r2.cloudflarestorage.com"
      }
    ]
  }
};

export default nextConfig;

