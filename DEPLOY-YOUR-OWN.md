# Tự deploy dashboard lên Cloudflare Workers của bạn

Hướng dẫn cho người mới clone repo này và muốn chạy trên **tài khoản Google + Cloudflare của chính mình**.
Toàn bộ chạy trên **Cloudflare Workers Free tier** (100k request/ngày) — đủ dùng cá nhân, không mất phí.

Tổng thời gian: ~15–20 phút. Chỉ cần copy–paste lệnh.

---

## Bạn cần có sẵn

- 1 tài khoản Google có quyền vào [Google Cloud Console](https://console.cloud.google.com/)
- 1 property **Google Analytics 4** muốn theo dõi
- 1 tài khoản [Cloudflare](https://dash.cloudflare.com/sign-up) (miễn phí)
- [Node.js ≥ 18](https://nodejs.org/) và `git` trên máy

---

## Phần A — Lấy quyền đọc GA4 (bên Google)

### A1. Lấy GA4 Property ID
GA4 → **Admin** (bánh răng) → **Property Settings**. Copy dãy số **Property ID** (ví dụ `123456789`).

### A2. Tạo Google Cloud project + bật API
1. Vào [Google Cloud Console](https://console.cloud.google.com/) → tạo project mới (hoặc dùng project sẵn có).
2. Menu → **APIs & Services → Library** → tìm **Google Analytics Data API** → bấm **Enable**.

### A3. Tạo Service Account + key JSON
1. **APIs & Services → Credentials → Create Credentials → Service account**.
2. Đặt tên bất kỳ → **Create and continue** → bỏ qua các bước quyền → **Done**.
3. Bấm vào service account vừa tạo → tab **Keys → Add key → Create new key → JSON → Create**.
4. File `.json` sẽ tải về máy. **Giữ kỹ, đây là khoá bí mật.** Copy email của service account (dạng `ten@project.iam.gserviceaccount.com`).

### A4. Cấp quyền cho service account đọc GA4
GA4 → **Admin → Property Access Management → +** (thêm người) → dán **email service account** ở A3 → chọn quyền **Viewer** → **Add**.

> Không có bước này thì API sẽ trả lỗi 403 (service account không thấy dữ liệu).

---

## Phần B — Deploy lên Cloudflare

### B1. Clone & cài đặt
```bash
git clone https://github.com/maigiadn/ga4-dashboard.git
cd ga4-dashboard
npm install
```

### B2. Đặt Property ID của bạn
Mở `wrangler.jsonc`, sửa `GA4_PROPERTY_ID` thành property của bạn (từ bước A1):
```jsonc
"vars": {
  "GA4_PROPERTY_ID": "123456789",   // ← property của BẠN
  "GA4_TOP_N": "10"
}
```
(Tuỳ chọn) đổi `"name"` nếu muốn subdomain khác `ga4-dashboard`.

### B3. Đăng nhập Cloudflare
```bash
npx wrangler login
```
Trình duyệt mở ra → chọn account → **Allow**.

### B4. Nạp khoá service account (secret)
Trỏ tới file JSON đã tải ở bước A3:
```bash
npx wrangler secret put GA4_SERVICE_ACCOUNT_JSON < /đường/dẫn/tới/service-account.json
```
> Cách này pipe thẳng từ file, không cần copy/paste. Secret được lưu **mã hoá** trên Cloudflare, không nằm trong code.

### B5. Deploy
```bash
npm run deploy
```
Kết thúc sẽ in ra URL dạng `https://<name>.<account>.workers.dev`.

### B6. Kiểm tra
Mở URL trên trình duyệt, hoặc:
```bash
curl "https://<name>.<account>.workers.dev/api/ga4?range=7"
```
Trả về JSON có `totalUsers`, `sessions`… là thành công.

---

## Chạy thử ở local (tuỳ chọn)

```bash
cp .dev.vars.example .dev.vars      # rồi điền GA4_SERVICE_ACCOUNT_JSON + GA4_PROPERTY_ID
npm run dev                          # http://localhost:3000
```
> `.dev.vars` đã được gitignore, không bị commit.

---

## Cập nhật / vận hành

| Việc | Lệnh |
|---|---|
| Deploy lại sau khi sửa code | `npm run deploy` |
| Đổi khoá service account | `npx wrangler secret put GA4_SERVICE_ACCOUNT_JSON < file.json` |
| Xem log runtime | `npx wrangler tail` |
| Gỡ Worker | `npx wrangler delete` |

---

## Lỗi thường gặp

| Lỗi | Nguyên nhân / cách xử lý |
|---|---|
| `Missing GA4_SERVICE_ACCOUNT_JSON` | Chưa chạy bước B4 (nạp secret) |
| API trả `403` / `PERMISSION_DENIED` | Chưa thêm email service account vào GA4 (bước A4) |
| API trả `SERVICE_DISABLED` | Chưa bật Google Analytics Data API (bước A2) |
| Số liệu trống | Property mới chưa có dữ liệu, hoặc sai `GA4_PROPERTY_ID` |

---

## Lưu ý bảo mật

- **Không commit** file `.json` khoá service account (đã được gitignore theo pattern `*service-account*.json`, `*-reporting-*.json`). Nếu file bạn tên khác, thêm vào `.gitignore`.
- Khoá chỉ nằm trong **Cloudflare secret**, không lộ ra frontend/response.
- Mỗi người deploy dùng **service account + property riêng** → dữ liệu tách biệt hoàn toàn.
