# Deploy lên Cloudflare Workers

App đã được migrate để chạy trên Cloudflare Workers qua [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare).
Không dùng `fs`, không dùng `googleapis`, không cần database. Bundle ~1 MB gzip → **vừa gói Free** (100k request/ngày).

## Kiến trúc sau migration

| Trước | Sau |
|---|---|
| `googleapis` package | `fetch()` gọi thẳng GA4 Data REST API (`analyticsdata.googleapis.com`) |
| `google.auth.GoogleAuth` (Node crypto) | `jose` ký JWT RS256 bằng WebCrypto → đổi lấy OAuth token |
| `fs.readFileSync(GA4_KEY_PATH)` | Secret `GA4_SERVICE_ACCOUNT_JSON` (dán nội dung JSON) |
| `next start` / Docker | `opennextjs-cloudflare build && deploy` |

Token OAuth được cache trong isolate (~1h) để không phải ký JWT mỗi request.

## Chuẩn bị

Cần: tài khoản Cloudflare + `node >= 18`. Service-account JSON của GA4 (cùng file bạn đang dùng local).

## Chạy local

```bash
npm install
cp .dev.vars.example .dev.vars   # rồi dán GA4_SERVICE_ACCOUNT_JSON vào (JSON 1 dòng)
npm run dev                      # http://localhost:3000
```

Muốn chạy đúng runtime Workers ở local:

```bash
npm run preview
```

## Deploy

```bash
# 1. Đăng nhập (1 lần)
npx wrangler login

# 2. Nạp secret service-account (dán toàn bộ nội dung file JSON rồi Enter)
npx wrangler secret put GA4_SERVICE_ACCOUNT_JSON

# 3. Build + deploy
npm run deploy
```

Xong sẽ có URL dạng `https://ga4-dashboard.<account>.workers.dev`.

## Biến môi trường

| Biến | Nơi đặt | Ghi chú |
|---|---|---|
| `GA4_SERVICE_ACCOUNT_JSON` | **secret** (`wrangler secret put`) | Bắt buộc. Toàn bộ nội dung file JSON service account |
| `GA4_PROPERTY_ID` | `wrangler.jsonc` → `vars` | Mặc định `331725099` |
| `GA4_TOP_N` | `wrangler.jsonc` → `vars` | Mặc định `10` |

> ⚠️ Không đặt `GA4_SERVICE_ACCOUNT_JSON` vào `vars` trong `wrangler.jsonc` (sẽ lộ khi commit). Luôn dùng `wrangler secret`.

## Ghi chú

- `Dockerfile` và `scripts/export-ga4.mjs` là tàn dư của bản chạy Node/offline cũ (script export vẫn dùng `googleapis`, chỉ chạy local, **không** thuộc bundle Worker). Có thể xoá nếu không cần.
- Muốn thêm cache tăng dần (ISR) sau này: cấu hình `incrementalCache` (R2/KV) trong `open-next.config.ts`.
