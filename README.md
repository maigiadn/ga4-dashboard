
# GA4 Content Intelligence Dashboard
Dashboard nội bộ theo dõi hiệu suất website từ Google Analytics 4 và hỗ trợ chiến lược content.
Để kết nối Google Analytics Data API (GA4) trang website của với công cụ, vui lòng truy cập bài viết hướng dẫn tại: 
http://maivangia.com/dung-openclaw-theo-doi-du-lieu-google-analytics
## Tính năng

- **KPI Cards**: Người dùng, Phiên, Lượt xem, Tỷ lệ tương tác (so sánh kỳ trước)
- **Biểu đồ xu hướng**: Đồ thị theo ngày cho Users / Sessions / Views
- **Top Landing Pages**: Bảng top 10 trang đích, sắp xếp theo lượt xem
- **Top Nguồn Traffic**: Bảng top 10 nguồn, kèm mini bar chart
- **Insight Nội dung**: Phân tích tự động xu hướng, trang nổi bật, trang yếu, gợi ý hành động
- **Bộ lọc**: 7 ngày / 14 ngày / 30 ngày
- **Dark mode** mặc định, giao diện tiếng Việt

## Cài đặt

### Yêu cầu
- Node.js 18+
- GA4 Service Account key (JSON)

### Bước 1: Cài đặt dependencies

```bash
cd C:\Users\admin\.openclaw\workspace\ga-dashboard
npm install
```

### Bước 2: Cấu hình

File `.env.local` đã được tạo sẵn với:

```
GA4_PROPERTY_ID=331725099
GA4_KEY_PATH=C:\Users\admin\.openclaw\workspace\secrets\teo-ga-reporting-94f8e01ceefd.json
GA4_TIMEZONE=Asia/Ho_Chi_Minh
GA4_TOP_N=10
```

Nếu cần thay đổi, sửa file `.env.local`.

### Bước 3: Chạy

```bash
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

## Cấu trúc thư mục

```
ga-dashboard/
├── src/
│   ├── app/
│   │   ├── api/ga4/route.ts      # API endpoint (server-side)
│   │   ├── globals.css            # Global styles
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Dashboard page
│   ├── components/
│   │   ├── FilterBar.tsx          # Bộ lọc ngày
│   │   ├── InsightsPanel.tsx      # Insight nội dung
│   │   ├── KpiCards.tsx           # KPI cards
│   │   ├── LandingPagesTable.tsx  # Bảng landing pages
│   │   ├── Skeletons.tsx          # Loading skeletons
│   │   ├── TimeSeriesChart.tsx    # Biểu đồ xu hướng
│   │   └── TrafficSourcesTable.tsx # Bảng nguồn traffic
│   └── lib/
│       └── ga4.ts                 # GA4 client + query helpers
├── .env.local                     # Config (không commit)
├── .gitignore
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Bảo mật

- Service account key chỉ chạy phía server (API route)
- Không expose key ra browser / network response
- `.env.local` và secret files đã được gitignore

## Troubleshooting

### Lỗi "Service account key not found"
Kiểm tra `GA4_KEY_PATH` trong `.env.local` trỏ đúng file JSON.

### Lỗi kết nối GA4
1. Kiểm tra Property ID đúng
2. Kiểm tra service account có quyền đọc GA4 property
3. Trong GA4 Admin → Property Access Management → thêm service account email

### Lỗi "Module not found"
```bash
npm install
```

## Phase 2 (đề xuất)

- Kết nối Google Search Console
- Danh sách trang cần update SEO
- Export báo cáo Markdown / JSON
- Custom date range picker
- So sánh 2 khoảng thời gian
- Đề xuất bài nên viết tiếp (dựa trên top queries)

Chuẩn bị trước khi cấu hình
Anh chỉ cần:

1 tài khoản Google có quyền vào Google Cloud
1 property GA4 cần theo dõi
Openclaw đang chạy ổn trên máy/VM

---
Bước 1: Tạo Google Cloud Project
Truy cập: https://console.cloud.google.com/
Tạo project mới
Ví dụ: [điền tên project của bạn vào đây]

Mẹo: đặt tên project rõ mục đích như analytics-reporting để dễ quản lý lâu dài.

---

Bước 2: Bật Google Analytics Data API
Trong project vừa tạo:

Vào APIs & Services
Chọn Enable APIs and Services
Tìm và bật: Google Analytics Data API
Đây là API bắt buộc để Openclaw có thể đọc dữ liệu GA4.

---

Bước 3: Tạo Service Account + tải key JSON
Vào IAM & Admin → Service Accounts
Tạo service account mới
Ví dụ: [điền tên service account của bạn vào đây]
Chọn service account vừa tạo → tab Keys
Add Key → Create new key → JSON
Tải file key JSON về máy

---

Bước 4: Đặt file key vào workspace Openclaw
Đưa file JSON vào đúng vị trí:

secrets/ga-service-account.json

Nếu chưa có thư mục secrets thì tạo mới.

Bảo mật bắt buộc
Không commit key lên GitHub.
Thêm vào .gitignore:

secrets/ga-service-account.json


---
Bước 5: Cấp quyền Service Account trong GA4
Truy cập: https://analytics.google.com/
Chọn property GA4: [điền GA4 ID của bạn vào đây]
Vào Admin → Property Access Management
Thêm email service account
Dạng: [điền service-account-email của bạn vào đây]
(ví dụ format: your-sa@your-project-id.iam.gserviceaccount.com)
Cấp quyền: Viewer

Quyền Viewer là đủ để đọc dữ liệu báo cáo.

---

Checklist kiểm tra nhanh sau khi setup
Đảm bảo đủ 3 điều kiện:
Đã bật Google Analytics Data API
File key tồn tại tại secrets/ga-service-account.json
Service account có quyền Viewer trong đúng property GA4

Nếu thiếu 1 trong 3, Openclaw sẽ không đọc được dữ liệu.
