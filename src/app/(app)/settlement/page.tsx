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
import { formatDateArabic } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import useSWR, { mutate } from 'swr';
import { settleDay } from '@/lib/actions/settlement.actions';
import type { Wallet } from '@prisma/client';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SettlementPage() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [isSettling, setIsSettling] = useState(false);
  
  const { data: wallets, error, isLoading } = useSWR<Wallet[]>('/api/wallets', fetcher);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
  
  const grandTotal = wallets?.reduce((acc, curr) => acc + curr.balance, 0) || 0;

  const handleSettleAndPrint = async () => {
    setIsSettling(true);

    const reportUrl = `/settlement/report?date=${format(date, 'yyyy-MM-dd')}`;
    window.open(reportUrl, '_blank');

    const result = await settleDay();

    if (result.success) {
      toast({
        title: 'نجاح',
        description: result.message,
      });
      // Re-fetch wallet data to show updated (zero) balances
      mutate('/api/wallets'); 
    } else {
      toast({
        title: 'خطأ',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsSettling(false);
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
                {date ? formatDateArabic(date) : <span>اختر تاريخًا</span>}
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
                <TableHead className="text-center">الرصيد الحالي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets?.map(wallet => (
                <TableRow key={wallet.id}>
                  <TableCell className="font-medium">{wallet.name}</TableCell>
                  <TableCell className="text-center font-bold">{formatCurrency(wallet.balance)}</TableCell>
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
                <TableCell className="text-center">{formatCurrency(grandTotal)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>إجراء نهائي</AlertTitle>
          <AlertDescription>
            عملية التسوية تقوم بتصفير أرصدة جميع المحافظ وإنشاء سجل تسوية دائم. لا يمكن التراجع عن هذا الإجراء.
          </AlertDescription>
      </Alert>
      
      <div className="mt-6 flex justify-end">
          <AlertDialog>
              <AlertDialogTrigger asChild>
                 <Button size="lg" disabled={isSettling}>
                    {isSettling ? 'جاري التسوية...' : 'بدء عملية التسوية والطباعة'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                      <AlertDialogDescription>
                          سيتم فتح تقرير التسوية للطباعة، وبعد ذلك سيتم تصفير أرصدة جميع المحافظ بشكل نهائي.
                          لا يمكن التراجع عن هذا الإجراء.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSettleAndPrint} disabled={isSettling}>
                        {isSettling ? 'جاري التنفيذ...' : 'نعم، قم بالتسوية والطباعة'}
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
      </div>

    </>
  );
}
