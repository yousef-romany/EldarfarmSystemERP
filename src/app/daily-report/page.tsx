
'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, ArrowUpCircle, ArrowDownCircle, MinusCircle, Wallet } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { sales, contributions, expenses, purchases, wallets } from '@/lib/data';
import Image from 'next/image';

export default function DailyReportPage() {
  const [date, setDate] = useState<Date>(new Date());
  
  const cashWalletId = 'w5';
  const cashWallet = wallets.find(w => w.id === cashWalletId);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);

  // Filter transactions for the selected date and cash wallet
  const cashSales = sales
    .flatMap(s => [...(s.payments || []), {amount: s.deposit || 0, date: s.saleDate, walletId: 'w5'}])
    .filter(p => p.walletId === cashWalletId && p.date && format(new Date(p.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));

  const cashContributions = contributions
    .flatMap(c => c.payments.map(p => ({...p, date: c.date})))
    .filter(p => p.walletId === cashWalletId && p.date && format(new Date(p.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));

  const cashExpenses = expenses
    .filter(e => e.payment?.walletId === cashWalletId && e.date && format(new Date(e.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
  
  // NOTE: Assuming purchases data will have payment details.
  // const cashPurchases = purchases
  //   .filter(p => p.payment?.walletId === cashWalletId && p.date && format(new Date(p.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
  const cashPurchases:any[] = [];


  const totalIn = cashSales.reduce((acc, s) => acc + (s?.amount || 0), 0) + cashContributions.reduce((acc, c) => acc + c.amount, 0);
  const totalOut = cashExpenses.reduce((acc, e) => acc + e.amount, 0) + cashPurchases.reduce((acc, p) => acc + p.amount, 0);
  const netChange = totalIn - totalOut;

  return (
    <>
      <PageHeader
        title="التقرير اليومي"
        action={
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-[280px] justify-start text-left font-normal"
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>اختر تاريخًا</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        }
      />

       <Card className="mb-6">
        <CardHeader>
          <CardTitle>ملخص الأرصدة وحركة النقدية لليوم</CardTitle>
          <CardDescription>عرض لأرصدة المحافظ وحركة الخزينة لليوم المحدد.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Daily Cash Flow Cards */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">مقبوضات نقدية</CardTitle>
                  <ArrowDownCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIn)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">مدفوعات نقدية</CardTitle>
                  <ArrowUpCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOut)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">صافي الحركة النقدية</CardTitle>
                  <MinusCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netChange)}</div>
                </CardContent>
              </Card>
               {cashWallet && (
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">الرصيد الحالي للخزينة</CardTitle>
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(cashWallet.balance)}</div>
                       <p className="text-xs text-muted-foreground">يتم تحديثه مع كل عملية</p>
                    </CardContent>
                  </Card>
               )}
            </div>
             <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
               {/* Other Wallet Balances */}
                {wallets.filter(w => w.id !== cashWalletId).map(wallet => (
                  <Card key={wallet.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{wallet.name}</CardTitle>
                       <Image src={wallet.icon} alt={wallet.name} width={20} height={20} className='rounded-md' data-ai-hint="logo" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(wallet.balance)}</div>
                      <p className="text-xs text-muted-foreground">الرصيد الحالي</p>
                    </CardContent>
                  </Card>
                ))}
            </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>المقبوضات النقدية</CardTitle>
            <CardDescription>جميع الأموال التي دخلت الخزينة في هذا اليوم.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المصدر</TableHead>
                  <TableHead>البيان</TableHead>
                  <TableHead className="text-left">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashSales.map((s, i) => (
                  <TableRow key={`sale-${i}`}>
                    <TableCell>بيع</TableCell>
                    <TableCell>دفعة من عملية بيع</TableCell>
                    <TableCell className="text-left font-medium">{formatCurrency(s.amount)}</TableCell>
                  </TableRow>
                ))}
                {cashContributions.map((c, i) => (
                  <TableRow key={`contrib-${i}`}>
                    <TableCell>مساهمة</TableCell>
                    <TableCell>دفعة من مساهمة</TableCell>
                    <TableCell className="text-left font-medium">{formatCurrency(c.amount)}</TableCell>
                  </TableRow>
                ))}
                {(cashSales.length === 0 && cashContributions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">لا توجد مقبوضات نقدية لهذا اليوم.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>المدفوعات النقدية</CardTitle>
            <CardDescription>جميع الأموال التي خرجت من الخزينة في هذا اليوم.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المصدر</TableHead>
                  <TableHead>البيان</TableHead>
                  <TableHead className="text-left">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashExpenses.map((e, i) => (
                  <TableRow key={`exp-${i}`}>
                    <TableCell>مصروف</TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell className="text-left font-medium">{formatCurrency(e.amount)}</TableCell>
                  </TableRow>
                ))}
                {(cashExpenses.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">لا توجد مدفوعات نقدية لهذا اليوم.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
