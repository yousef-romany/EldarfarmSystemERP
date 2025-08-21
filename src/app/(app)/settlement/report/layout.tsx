
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تقرير تسوية اليومية',
  description: 'عرض وطباعة تقرير تسوية اليومية',
};

export default function ReportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
