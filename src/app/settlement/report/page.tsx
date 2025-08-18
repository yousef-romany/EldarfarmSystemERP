
'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { sales, contributions, expenses, purchases, wallets } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Printer, FileText } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const SettlementReportPage = () => {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const reportDate = dateParam ? new Date(dateParam) : new Date();

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);

  const dailyTransactions = wallets.map(wallet => {
    const cashSalesDeposits = sales
        .filter(s => s.deposit && s.type === 'Deferred' && s.saleDate && format(new Date(s.saleDate), 'yyyy-MM-dd') === format(reportDate, 'yyyy-MM-dd'))
        .flatMap(s => (s.payments || []).filter(p => p.walletId === wallet.id).map(p => ({...p, description: `عربون للعملية #${s.id}`})));

    const inflows = [
      ...sales.flatMap(s => s.payments || []).filter(p => p.walletId === wallet.id && p.date && format(new Date(p.date), 'yyyy-MM-dd') === format(reportDate, 'yyyy-MM-dd')).map(p => ({...p, description: 'دفعة من عملية بيع'})),
      ...contributions.flatMap(c => c.payments.map(p => ({...p, date: c.date, description: `دفعة من ${c.donorName}`}))).filter(p => p.walletId === wallet.id && p.date && format(new Date(p.date), 'yyyy-MM-dd') === format(reportDate, 'yyyy-MM-dd')),
    ];

    const outflows = [
      ...expenses.filter(e => e.payment?.walletId === wallet.id && format(new Date(e.date), 'yyyy-MM-dd') === format(reportDate, 'yyyy-MM-dd')),
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

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    // Automatically trigger print dialog when component mounts
    setTimeout(handlePrint, 1000);
  }, []);

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
                  {dailyTransactions.map(t => (
                    <div key={t.wallet.id} className='mb-8 break-inside-avoid'>
                      <CardHeader className='p-0 mb-4'>
                          <CardTitle className='text-xl border-b pb-2 mb-2'>تقرير محفظة: {t.wallet.name}</CardTitle>
                      </CardHeader>
                      <div className="grid grid-cols-2 gap-8">
                          <div>
                              <h4 className="font-bold mb-2 text-green-600">المقبوضات</h4>
                              <Table>
                                  <TableHeader><TableRow><TableHead>المصدر</TableHead><TableHead className='text-right'>المبلغ</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                      {t.inflows.map((inflow, i) => (
                                          <TableRow key={`in-${i}`}><TableCell>{inflow.description || 'دفعة عملية'}</TableCell><TableCell className='text-right'>{formatCurrency(inflow.amount)}</TableCell></TableRow>
                                      ))}
                                      {t.inflows.length === 0 && <TableRow><TableCell colSpan={2} className='text-center text-muted-foreground'>لا توجد مقبوضات</TableCell></TableRow>}
                                  </TableBody>
                              </Table>
                          </div>
                           <div>
                              <h4 className="font-bold mb-2 text-red-600">المدفوعات</h4>
                               <Table>
                                  <TableHeader><TableRow><TableHead>المصدر</TableHead><TableHead className='text-right'>المبلغ</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                       {t.outflows.map((outflow, i) => (
                                          <TableRow key={`out-${i}`}><TableCell>{outflow.description}</TableCell><TableCell className='text-right'>{formatCurrency(outflow.amount)}</TableCell></TableRow>
                                      ))}
                                       {t.outflows.length === 0 && <TableRow><TableCell colSpan={2} className='text-center text-muted-foreground'>لا توجد مدفوعات</TableCell></TableRow>}
                                  </TableBody>
                              </Table>
                          </div>
                      </div>
                      <CardFooter className='p-0 mt-4 flex flex-col items-end space-y-2'>
                          <Separator className="my-2" />
                          <div className="flex justify-between w-full font-semibold">
                              <span>إجمالي المقبوضات:</span>
                              <span className="text-green-600">{formatCurrency(t.totalIn)}</span>
                          </div>
                          <div className="flex justify-between w-full font-semibold">
                              <span>إجمالي المدفوعات:</span>
                              <span className="text-red-600">{formatCurrency(t.totalOut)}</span>
                          </div>
                           <Separator className="my-2" />
                           <div className="flex justify-between w-full font-bold text-lg">
                              <span>الرصيد النهائي للمحفظة:</span>
                              <span>{formatCurrency(t.closingBalance)}</span>
                          </div>
                      </CardFooter>
                    </div>
                  ))}
                  <div className='break-before-page'></div>
                  <CardFooter className='p-0 mt-8 flex flex-col items-end space-y-2 bg-muted p-4 rounded-lg'>
                     <Separator className="my-4" />
                     <div className="flex justify-between w-full font-bold text-2xl">
                        <span>إجمالي المبلغ المسلّم:</span>
                        <span>{formatCurrency(grandTotal)}</span>
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
