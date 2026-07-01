/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Media is served from storage (local /uploads in dev, Vercel Blob in prod);
  // allow remote blob images.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.public.blob.vercel-storage.com' }]
  }
};

export default nextConfig;
