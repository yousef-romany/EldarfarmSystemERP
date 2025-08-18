
'use client';
import { MoreHorizontal, PlusCircle, Trash2, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { wallets, contributions } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { format } from 'date-fns';
import { useState } from 'react';
import type { Payment, Contribution } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';

export default function ContributionsPage() {
  const [payments, setPayments] = useState<Partial<Payment[]>>([{}]);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const totalPaid = payments.reduce((acc, p) => acc + (p?.amount || 0), 0);
  const remainingBalance = totalAmount - totalPaid;

  const handleAddPayment = () => {
    setPayments([...payments, {}]);
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };

  const handlePaymentChange = (index: number, field: keyof Payment, value: string | number) => {
    const newPayments = [...payments];
    const payment = newPayments[index] || {};
    (payment as any)[field] = value;
    newPayments[index] = payment;
    setPayments(newPayments);
  };
  
  const getWalletName = (walletId: string) => wallets.find(w => w.id === walletId)?.name;

  return (
    <>
      <PageHeader title="إدارة المساهمات النقدية" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>سجل المساهمات</CardTitle>
                <CardDescription>قائمة بجميع المساهمات النقدية والنذور المسجلة.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>المانح</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead className="text-left">المبلغ</TableHead>
                        <TableHead>
                        <span className="sr-only">الإجراءات</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {contributions.map((contribution) => (
                        <TableRow key={contribution.id}>
                        <TableCell className="font-medium">{contribution.donorName}</TableCell>
                        <TableCell>{contribution.description}</TableCell>
                        <TableCell>{format(new Date(contribution.date), 'yyyy-MM-dd')}</TableCell>
                        <TableCell className="text-left">{contribution.totalAmount.toLocaleString()} ج.م</TableCell>
                        <TableCell>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">فتح القائمة</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                <DropdownMenuItem>تعديل</DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Printer className="mr-2 h-4 w-4" />
                                    طباعة الإيصال
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                    حذف
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>تسجيل مساهمة جديدة</CardTitle>
              <CardDescription>
                استخدم هذا النموذج لتسجيل نذر نقدي أو أي مساهمة مالية أخرى.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="donor-name">اسم المانح</Label>
                  <Input id="donor-name" placeholder="e.g., يوسف رومانى" />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea id="description" placeholder="e.g., نذر بقيمة خروف, تبرع عام" />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="total-amount">المبلغ الإجمالي</Label>
                  <Input id="total-amount" type="number" placeholder="المبلغ المستلم" onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">تاريخ الاستلام</Label>
                  <Input id="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                </div>

              <Card>
                <CardHeader>
                    <CardTitle className='text-lg'>تفاصيل الدفع</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className="space-y-3">
                    {payments.map((payment, index) => (
                      <div key={index} className="flex items-end gap-2 p-2 border rounded-md">
                        <div className="grid gap-2 flex-1">
                          <Label htmlFor={`wallet-${index}`}>المحفظة / الحساب</Label>
                          <Select onValueChange={(value) => handlePaymentChange(index, 'walletId', value)}>
                            <SelectTrigger id={`wallet-${index}`}>
                              <SelectValue placeholder="اختر محفظة..." />
                            </SelectTrigger>
                            <SelectContent>
                              {wallets.map((wallet) => (
                                <SelectItem key={wallet.id} value={wallet.id}>
                                  {wallet.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`amount-${index}`}>المبلغ</Label>
                          <Input id={`amount-${index}`} type="number" placeholder="المبلغ" onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)} />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePayment(index)}
                          disabled={payments.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleAddPayment}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    إضافة دفعة أخرى
                  </Button>
                </CardContent>
                <CardContent>
                  <div className='flex justify-between items-center p-3 bg-muted rounded-md mb-2'>
                      <span className='font-semibold'>الإجمالي المدفوع:</span>
                      <span className='font-bold text-lg'>
                        {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(totalPaid)}
                      </span>
                  </div>
                   <div className='flex justify-between items-center p-3 bg-muted rounded-md'>
                      <span className='font-semibold'>المبلغ المتبقي:</span>
                      <span className='font-bold text-lg text-destructive'>
                        {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(remainingBalance)}
                      </span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button disabled={!totalAmount || remainingBalance !== 0}>تسجيل المساهمة</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

