import {
  ClerkProvider,
} from '@clerk/nextjs';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'BrandBoosters AI CEO — Agency Operating System',
  description: 'AI-powered agency management dashboard for BrandBoosters Marketing Agency. Real-time productivity tracking, gamified sales pipeline, and intelligent task delegation.',
  keywords: ['agency dashboard', 'AI productivity', 'marketing agency', 'task management'],
  authors: [{ name: 'BrandBoosters' }],
  openGraph: {
    title: 'BrandBoosters AI CEO',
    description: 'The AI-powered operating system for BrandBoosters Marketing Agency',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-surface-base text-text-primary">
        <ClerkProvider>
          {children}
          <Toaster position="bottom-right" />
        </ClerkProvider>
      </body>
    </html>
  );
}
