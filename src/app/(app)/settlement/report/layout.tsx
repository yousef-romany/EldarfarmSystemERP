
import type { Metadata } from 'next';
import React, { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'تقرير تسوية اليومية',
  description: 'عرض وطباعة تقرير تسوية اليومية',
};

export default function ReportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Suspense fallback={<div>جاري تحميل التقرير...</div>}>{children}</Suspense>;
}
