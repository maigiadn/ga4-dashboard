import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // No `output: 'standalone'` — @opennextjs/cloudflare produces its own worker bundle.
};

export default nextConfig;

// Makes Cloudflare bindings / env available during `next dev`.
initOpenNextCloudflareForDev();
