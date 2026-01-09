
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatDateTimeArabic } from '@/lib/utils';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function WalletTransactionsPage({ params }: { params: { id: string } }) {
  const walletId = params.id;

  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
    include: {
      payments: {
        orderBy: { date: 'desc' },
      },
    },
  });

  if (!wallet) {
    notFound();
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title={`حركات المحفظة: ${wallet.name}`} className="mb-0" />
        <Button asChild variant="outline">
          <Link href="/wallets">الرجوع إلى المحافظ</Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الرصيد الحالي</CardTitle>
                <Badge>الإجمالي</Badge>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(wallet.balance)}</div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>سجل المعاملات</CardTitle>
          <CardDescription>قائمة بجميع المعاملات التي تمت على هذه المحفظة.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>البيان</TableHead>
                <TableHead className="text-left">المبلغ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallet.payments.length > 0 ? (
                wallet.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDateTimeArabic(payment.date)}</TableCell>
                    <TableCell>
                      <Badge variant={payment.type === 'Income' ? 'default' : 'destructive'}>
                        {payment.type === 'Income' ? <ArrowDownCircle className="mr-1 h-4 w-4" /> : <ArrowUpCircle className="mr-1 h-4 w-4" />}
                        {payment.type === 'Income' ? 'دخل' : 'صرف'}
                      </Badge>
                    </TableCell>
                    <TableCell>{payment.description}</TableCell>
                    <TableCell className="text-left font-medium">{formatCurrency(payment.amount)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    لا توجد حركات مسجلة على هذه المحفظة بعد.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
