import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تسجيل الدخول - مدير المواشي',
  description: 'صفحة تسجيل الدخول لنظام إدارة المواشي',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
