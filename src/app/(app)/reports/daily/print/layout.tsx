
import type { Metadata } from 'next';
import React, { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'التقرير المالي اليومي',
  description: 'عرض وطباعة التقرير المالي اليومي المفصل',
};

export default function ReportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Suspense fallback={<div>جاري تحميل التقرير...</div>}>{children}</Suspense>;
}
