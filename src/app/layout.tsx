import {
  ClerkProvider,
} from '@clerk/nextjs';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import ClientOnly from '@/components/ClientOnly';

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const removeAttr = (el) => {
                  if (el.removeAttribute) {
                    el.removeAttribute('bis_skin_checked');
                  }
                };
                const observer = new MutationObserver((mutations) => {
                  for (const m of mutations) {
                    if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
                      removeAttr(m.target);
                    } else if (m.addedNodes) {
                      m.addedNodes.forEach((n) => {
                        if (n.nodeType === 1) {
                          if (n.hasAttribute && n.hasAttribute('bis_skin_checked')) removeAttr(n);
                          if (n.querySelectorAll) {
                            n.querySelectorAll('[bis_skin_checked]').forEach(removeAttr);
                          }
                        }
                      });
                    }
                  }
                });
                observer.observe(document.documentElement, {
                  childList: true,
                  subtree: true,
                  attributes: true,
                  attributeFilter: ['bis_skin_checked']
                });
              })();
            `
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-surface-base text-text-primary" suppressHydrationWarning>
        <ClerkProvider>
          {children}
          <ClientOnly>
            <Toaster position="bottom-right" />
          </ClientOnly>
        </ClerkProvider>
      </body>
    </html>
  );
}
