/** @type {import('next').NextConfig} */
const nextConfig = {

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "http://localhost:8080/:path*",
      },
    ];
  }

  // 🔹 rewrites는 S3 정적 호스팅에서는 동작하지 않으니 제거
}

export default nextConfig
