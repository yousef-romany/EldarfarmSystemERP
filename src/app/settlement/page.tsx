
'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Printer, AlertTriangle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { sales, contributions, expenses, wallets } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';

export default function SettlementPage() {
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);

  const dailyTransactions = wallets.map(wallet => {
    const inflows = [
      ...sales.flatMap(s => s.payments || []).filter(p => p.walletId === wallet.id && p.date && format(new Date(p.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')),
      ...contributions.flatMap(c => c.payments.map(p => ({...p, date: c.date}))).filter(p => p.walletId === wallet.id && p.date && format(new Date(p.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')),
    ];
    const outflows = [
      ...expenses.filter(e => e.payment?.walletId === wallet.id && format(new Date(e.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')),
      // Assuming purchases have payment details
    ];

    const totalIn = inflows.reduce((acc, curr) => acc + curr.amount, 0);
    const totalOut = outflows.reduce((acc, curr) => acc + curr.amount, 0);
    
    return {
      wallet,
      inflows,
      outflows,
      totalIn,
      totalOut,
      netChange: totalIn - totalOut,
      closingBalance: wallet.balance, // This should be calculated based on opening balance + net change
    };
  });

  const grandTotal = dailyTransactions.reduce((acc, curr) => acc + curr.closingBalance, 0);

  const handlePrintAndSettle = () => {
    const url = `/settlement/report?date=${format(date, 'yyyy-MM-dd')}`;
    const printWindow = window.open(url, '_blank');
    
    // After printing, we would zero out the wallets.
    // This is a placeholder for the actual settlement logic.
    console.log("Settling accounts and zeroing out balances...");
    // For demo purposes, we can navigate back to the page to show balances are "zeroed"
    // In a real app, this would trigger a state update/API call.
  };

  return (
    <>
      <PageHeader
        title="تسوية اليومية"
        action={
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="ml-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>اختر تاريخًا</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
            </PopoverContent>
          </Popover>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>ملخص أرصدة المحافظ لليوم المحدد</CardTitle>
          <CardDescription>عرض لجميع أرصدة المحافظ والخزائن في نهاية اليوم المحدد. هذه هي المبالغ التي سيتم تسويتها وتسليمها.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المحفظة / الخزينة</TableHead>
                <TableHead className="text-left">الرصيد النهائي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyTransactions.map(t => (
                <TableRow key={t.wallet.id}>
                  <TableCell className="font-medium">{t.wallet.name}</TableCell>
                  <TableCell className="text-left font-bold">{formatCurrency(t.wallet.balance)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted font-bold text-lg">
                <TableCell>الإجمالي الكلي</TableCell>
                <TableCell className="text-left">{formatCurrency(grandTotal)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>إجراء نهائي</AlertTitle>
          <AlertDescription>
            عملية التسوية تقوم بتصفير أرصدة جميع المحافظ. لا يمكن التراجع عن هذا الإجراء.
          </AlertDescription>
      </Alert>
      
      <div className="mt-6 flex justify-end">
          <AlertDialog>
              <AlertDialogTrigger asChild>
                 <Button size="lg">
                    <Printer className="mr-2 h-4 w-4" />
                    طباعة تقرير التسوية وتصفير الأرصدة
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                      <AlertDialogDescription>
                          سيتم فتح تقرير التسوية في صفحة جديدة للطباعة. بعد ذلك، سيتم تصفير أرصدة جميع المحافظ والخزائن. هذا الإجراء لا يمكن التراجع عنه.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={handlePrintAndSettle}>نعم، قم بالتسوية والتصفير</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
      </div>

    </>
  );
}
