/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export — produces ./out, served as-is behind Caddy.
  output: "export",
  // Clean URLs: /blog -> /blog/index.html (works with a static file server).
  trailingSlash: true,
  // No Next image optimization server in a static export.
  images: { unoptimized: true },
};

export default nextConfig;
