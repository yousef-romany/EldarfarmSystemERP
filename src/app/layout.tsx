import type { Metadata } from 'next';
// import { Inter } from 'next/font/google'; // Removed to prevent network errors
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

// const inter = Inter({ subsets: ['latin'], variable: '--font-inter' }); // Removed to prevent network errors

export const metadata: Metadata = {
  title: 'Mawashi Manager',
  description: 'Livestock Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
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
      </body>
    </html>
  );
}
