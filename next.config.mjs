/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔹 정적 export 모드 (S3에 올릴 수 있는 순수 HTML/JS/CSS 생성)
  output: "export",

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 🔹 rewrites는 S3 정적 호스팅에서는 동작하지 않으니 제거
}

export default nextConfig
