import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'فاتورة البيع',
  description: 'عرض وطباعة فاتورة عملية البيع',
};

export default function InvoiceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
