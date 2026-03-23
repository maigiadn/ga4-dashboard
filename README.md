# GA4 Content Intelligence Dashboard

Dashboard nội bộ theo dõi hiệu suất website từ Google Analytics 4 và hỗ trợ chiến lược content.

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
