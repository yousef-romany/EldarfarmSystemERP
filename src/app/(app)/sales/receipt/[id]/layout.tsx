import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'إيصال بيع',
  description: 'عرض وطباعة إيصال عملية البيع',
};

export default function ReceiptLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
