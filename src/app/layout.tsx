import type { Metadata } from 'next';
// import { Inter } from 'next/font/google'; // Removed to prevent network errors
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import Script from 'next/script';
import { InstallPwaButton } from '@/components/install-pwa-button';


// const inter = Inter({ subsets: ['latin'], variable: '--font-inter' }); // Removed to prevent network errors

export const metadata: Metadata = {
  title: 'Mawashi Manager',
  description: 'Livestock Management System',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mawashi Manager',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
       <head>
        <meta name="theme-color" content="#343a40" />
      </head>
      <body className={`font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
         <Script id="service-worker-registration">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(registration => {
                  console.log('Service Worker registered with scope:', registration.scope);
                }).catch(error => {
                  console.log('Service Worker registration failed:', error);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
