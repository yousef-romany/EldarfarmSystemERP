
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import type { Wallet } from '@prisma/client';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SettlementPage() {
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
  
  // We'll use SWR to fetch the current wallet balances
  const { data: wallets, error, isLoading } = useSWR<Wallet[]>('/api/wallets', fetcher);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
  
  const grandTotal = wallets?.reduce((acc, curr) => acc + curr.balance.toNumber(), 0) || 0;

  const handlePrintAndSettle = () => {
    // In a real app, we would call a server action here to perform the settlement.
    // For now, it just opens the print report page.
    const url = `/settlement/report?date=${format(date, 'yyyy-MM-dd')}`;
    window.open(url, '_blank');
  };
  
  if (error) return <div>فشل في تحميل أرصدة المحافظ...</div>
  if (isLoading) return <div>جاري تحميل الأرصدة...</div>


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
          <CardTitle>ملخص أرصدة المحافظ الحالية</CardTitle>
          <CardDescription>عرض لجميع أرصدة المحافظ والخزائن الحالية. هذه هي المبالغ التي سيتم تسويتها وتسليمها.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المحفظة / الخزينة</TableHead>
                <TableHead className="text-left">الرصيد الحالي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets?.map(wallet => (
                <TableRow key={wallet.id}>
                  <TableCell className="font-medium">{wallet.name}</TableCell>
                  <TableCell className="text-left font-bold">{formatCurrency(wallet.balance.toNumber())}</TableCell>
                </TableRow>
              ))}
               {!wallets || wallets.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                        لا توجد محافظ لعرضها.
                    </TableCell>
                  </TableRow>
               )}
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
            عملية التسوية تقوم بتصفير أرصدة جميع المحافظ. لا يمكن التراجع عن هذا الإجراء. (الوظيفة تحت الإنشاء)
          </AlertDescription>
      </Alert>
      
      <div className="mt-6 flex justify-end">
          <AlertDialog>
              <AlertDialogTrigger asChild>
                 <Button size="lg" disabled>
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
