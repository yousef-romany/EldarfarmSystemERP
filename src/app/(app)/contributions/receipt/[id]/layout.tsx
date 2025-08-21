
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'إيصال مساهمة',
  description: 'عرض وطباعة إيصال المساهمة النقدية',
};

export default function ReceiptLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
