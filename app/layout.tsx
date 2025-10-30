import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Planora - Smart Trip Planning',
  description: 'AI-powered travel planning application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

