import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Using Inter as primary font (similar to Geist)
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Event Sphere',
  description: 'Event management application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans antialiased bg-white flex flex-col min-h-screen">
        {children}
      </body>
    </html>
  );
}