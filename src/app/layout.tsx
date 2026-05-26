import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Xoso Web',
  description: 'Web do xo so public co dang nhap rieng.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
