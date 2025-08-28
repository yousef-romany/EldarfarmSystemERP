
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'إيصال نذر نقدي',
  description: 'عرض وطباعة إيصال النذر النقدي',
};

export default function ReceiptLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
