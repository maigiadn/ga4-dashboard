import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Default config is enough for this app (no ISR/tag cache needed).
  // To add incremental cache later, wire an R2/KV incrementalCache here.
});
