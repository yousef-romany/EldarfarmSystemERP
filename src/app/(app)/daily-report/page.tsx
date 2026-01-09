
'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, ArrowUpCircle, ArrowDownCircle, MinusCircle, Wallet as WalletIcon, Banknote, Printer } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { formatDateArabic } from '@/lib/utils';
import useSWR from 'swr';
import Image from 'next/image';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface DailyReportData {
  wallets: {
    id: string;
    name: string;
    balance: number;
    icon: string;
  }[];
  financialSummary: {
    totalIn: number;
    totalOut: number;
    netChange: number;
  };
  transactions: {
    inflows: { type: string, description: string, amount: number }[];
    outflows: { type: string, description: string, amount: number }[];
  }
}

export default function DailyReportPage() {
  const [date, setDate] = useState<Date>(new Date());
  
  const dateString = format(date, 'yyyy-MM-dd');
  const { data, error, isLoading } = useSWR<DailyReportData>(`/api/reports/daily?date=${dateString}`, fetcher);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);

  const handlePrint = () => {
    const url = `/reports/daily/print?date=${dateString}`;
    window.open(url, '_blank');
  };
  
  if (error) return <div>فشل في تحميل البيانات...</div>
  if (isLoading) return <div>جاري تحميل التقرير...</div>
  if (!data) return <div>لا توجد بيانات لهذا اليوم.</div>

  const { financialSummary, transactions, wallets } = data;


  return (
    <>
      <PageHeader
        title="التقرير المالي اليومي"
        action={
            <div className="flex gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-[280px] justify-start text-left font-normal"
                    >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {date ? formatDateArabic(date) : <span>اختر تاريخًا</span>}
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
                 <Button variant="outline" size="icon" onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                    <span className="sr-only">طباعة</span>
                </Button>
            </div>
        }
      />

       <Card className="mb-6">
        <CardHeader>
          <CardTitle>ملخص الأرصدة والحركة المالية لليوم</CardTitle>
          <CardDescription>عرض لأرصدة المحافظ وإجمالي الحركات المالية لليوم المحدد.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Daily Cash Flow Cards */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المقبوضات</CardTitle>
                  <ArrowDownCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.totalIn)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المدفوعات</CardTitle>
                  <ArrowUpCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(financialSummary.totalOut)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">صافي الحركة المالية</CardTitle>
                  <MinusCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${financialSummary.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(financialSummary.netChange)}</div>
                </CardContent>
              </Card>
            </div>
             <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
               {/* Other Wallet Balances */}
                {wallets.map(wallet => (
                  <Card key={wallet.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{wallet.name}</CardTitle>
                       { wallet.icon === 'cash' ? <Banknote className="h-4 w-4 text-muted-foreground" /> : <WalletIcon className="h-4 w-4 text-muted-foreground" /> }
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
            <CardTitle>سجل المقبوضات</CardTitle>
            <CardDescription>جميع الأموال التي دخلت كل المحافظ في هذا اليوم.</CardDescription>
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
                {transactions.inflows.map((item, i) => (
                  <TableRow key={`in-${i}`}>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-left font-medium">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
                {transactions.inflows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">لا توجد مقبوضات لهذا اليوم.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>سجل المدفوعات</CardTitle>
            <CardDescription>جميع الأموال التي خرجت من كل المحافظ في هذا اليوم.</CardDescription>
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
                {transactions.outflows.map((item, i) => (
                  <TableRow key={`out-${i}`}>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-left font-medium">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
                {transactions.outflows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">لا توجد مدفوعات لهذا اليوم.</TableCell>
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
