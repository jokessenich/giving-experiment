import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'the giving experiment',
  description: 'A small thing, passed along. People put something in the mail and pass it on. If you need it, take it. If not, add to it and send it onward.',
  openGraph: {
    title: 'the giving experiment',
    description: 'A small thing, passed along.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
