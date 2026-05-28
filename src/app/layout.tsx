import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Sổ vé 3 miền',
    template: '%s | Sổ vé 3 miền',
  },
  description: 'Sổ vé nội bộ để nhập tin, dò kết quả và tổng hợp lãi lỗ.',
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
