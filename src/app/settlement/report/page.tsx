
'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Printer, FileText } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface DailyReportData {
  wallets: {
    id: string;
    name: string;
    balance: number;
    icon: string;
  }[];
  cashWalletId: string;
  cashFlow: {
    totalIn: number;
    totalOut: number;
    netChange: number;
  };
  transactions: {
    inflows: { type: string, description: string, amount: number }[];
    outflows: { type: string, description: string, amount: number }[];
  }
}

const SettlementReportPage = () => {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const reportDate = dateParam ? new Date(dateParam) : new Date();
  const dateString = format(reportDate, 'yyyy-MM-dd');
  
  const { data, error, isLoading } = useSWR<DailyReportData>(`/api/reports/daily?date=${dateString}`, fetcher);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (data && !isLoading) {
      setTimeout(handlePrint, 1000);
    }
  }, [data, isLoading]);

  if (isLoading) return <div>جاري تحميل التقرير...</div>;
  if (error) return <div>فشل في تحميل التقرير.</div>;
  if (!data) return <div>لا توجد بيانات لهذا اليوم.</div>;
  
  const cashWallet = data.wallets.find(w => w.id === data.cashWalletId);
  const totalBalance = data.wallets.reduce((acc, w) => acc + w.balance, 0);

  return (
    <div className="bg-white min-h-screen p-8 font-body">
        <div className="w-full max-w-4xl mx-auto space-y-4">
             <div className="flex justify-end gap-2 no-print">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    طباعة
                </Button>
            </div>
            <Card className="p-6 sm:p-8 print-friendly">
                <CardHeader className="p-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText className="h-12 w-12 text-primary" />
                            <div>
                                <h1 className="text-2xl font-bold">تقرير التسوية اليومية</h1>
                                <p className="text-muted-foreground">دير مار جرجس بالرزيقات</p>
                            </div>
                        </div>
                        <div className="text-left">
                            <p><strong>تاريخ التقرير:</strong> {format(reportDate, 'yyyy-MM-dd')}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 mt-8">
                  {cashWallet && (
                    <div className='mb-8 break-inside-avoid'>
                      <CardHeader className='p-0 mb-4'>
                          <CardTitle className='text-xl border-b pb-2 mb-2'>تقرير الخزينة: {cashWallet.name}</CardTitle>
                      </CardHeader>
                      <div className="grid grid-cols-2 gap-8">
                          <div>
                              <h4 className="font-bold mb-2 text-green-600">المقبوضات النقدية</h4>
                              <Table>
                                  <TableHeader><TableRow><TableHead>المصدر</TableHead><TableHead className='text-right'>المبلغ</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                      {data.transactions.inflows.map((inflow, i) => (
                                          <TableRow key={`in-${i}`}><TableCell>{inflow.description || inflow.type}</TableCell><TableCell className='text-right'>{formatCurrency(inflow.amount || 0)}</TableCell></TableRow>
                                      ))}
                                      {data.transactions.inflows.length === 0 && <TableRow><TableCell colSpan={2} className='text-center text-muted-foreground'>لا توجد مقبوضات</TableCell></TableRow>}
                                  </TableBody>
                              </Table>
                          </div>
                           <div>
                              <h4 className="font-bold mb-2 text-red-600">المدفوعات النقدية</h4>
                               <Table>
                                  <TableHeader><TableRow><TableHead>المصدر</TableHead><TableHead className='text-right'>المبلغ</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                       {data.transactions.outflows.map((outflow, i) => (
                                          <TableRow key={`out-${i}`}><TableCell>{outflow.description || outflow.type}</TableCell><TableCell className='text-right'>{formatCurrency(outflow.amount)}</TableCell></TableRow>
                                      ))}
                                       {data.transactions.outflows.length === 0 && <TableRow><TableCell colSpan={2} className='text-center text-muted-foreground'>لا توجد مدفوعات</TableCell></TableRow>}
                                  </TableBody>
                              </Table>
                          </div>
                      </div>
                      <CardFooter className='p-0 mt-4 flex flex-col items-end space-y-2'>
                          <Separator className="my-2" />
                          <div className="flex justify-between w-full font-semibold">
                              <span>إجمالي المقبوضات النقدية:</span>
                              <span className="text-green-600">{formatCurrency(data.cashFlow.totalIn)}</span>
                          </div>
                          <div className="flex justify-between w-full font-semibold">
                              <span>إجمالي المدفوعات النقدية:</span>
                              <span className="text-red-600">{formatCurrency(data.cashFlow.totalOut)}</span>
                          </div>
                           <Separator className="my-2" />
                           <div className="flex justify-between w-full font-bold text-lg">
                              <span>الرصيد النهائي للخزينة:</span>
                              <span>{formatCurrency(cashWallet.balance)}</span>
                          </div>
                      </CardFooter>
                    </div>
                  )}
                  <div className='break-before-page'></div>
                  <CardHeader className='p-0 mb-4 mt-8'>
                      <CardTitle className='text-xl border-b pb-2 mb-2'>ملخص الأرصدة النهائية</CardTitle>
                  </CardHeader>
                  <Table>
                      <TableHeader><TableRow><TableHead>المحفظة/الحساب</TableHead><TableHead className='text-right'>الرصيد النهائي</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {data.wallets.map(wallet => (
                          <TableRow key={wallet.id}>
                            <TableCell>{wallet.name}</TableCell>
                            <TableCell className='text-right'>{formatCurrency(wallet.balance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                  </Table>
                  <CardFooter className='p-0 mt-8 flex flex-col items-end space-y-2 bg-muted p-4 rounded-lg'>
                     <Separator className="my-4" />
                     <div className="flex justify-between w-full font-bold text-2xl">
                        <span>إجمالي المبلغ المسلّم (جميع المحافظ):</span>
                        <span>{formatCurrency(totalBalance)}</span>
                     </div>
                  </CardFooter>
                  <div className="mt-16 grid grid-cols-2 gap-16 text-center text-sm">
                      <div>
                          <p>.........................................</p>
                          <p className='font-bold'>المستلم</p>
                      </div>
                       <div>
                          <p>.........................................</p>
                          <p className='font-bold'>المُسلِّم</p>
                      </div>
                  </div>
                   <div className="mt-8 text-center text-xs text-muted-foreground">
                        <p>دير مار جرجس بالرزيقات - {new Date().getFullYear()}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
        <style jsx global>{`
            @media print {
              body {
                  background-color: #fff !important;
                  -webkit-print-color-adjust: exact;
              }
              .no-print {
                  display: none;
              }
              .print-friendly {
                  box-shadow: none;
                  border: none;
              }
              .break-inside-avoid {
                page-break-inside: avoid;
              }
               .break-before-page {
                page-break-before: always;
              }
            }
        `}</style>
    </div>
  );
};

export default SettlementReportPage;
