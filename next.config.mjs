/** @type {import('next').NextConfig} */
const nextConfig = {

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 🔹 rewrites는 S3 정적 호스팅에서는 동작하지 않으니 제거
}

export default nextConfig
