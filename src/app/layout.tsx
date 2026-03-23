import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GA4 Content Dashboard",
  description: "Dashboard theo dõi hiệu suất website và chiến lược content từ GA4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-grid min-h-screen">
        {children}
      </body>
    </html>
  );
}
