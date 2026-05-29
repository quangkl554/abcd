import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Hệ thống tự động số',
    template: '%s | Hệ thống tự động số',
  },
  description: 'Hệ thống nội bộ để nhập tin, dò kết quả và tổng hợp lãi lỗ.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
