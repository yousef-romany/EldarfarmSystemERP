
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { Payment } from '@/lib/types';
import { wallets } from '@/lib/data';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewContributionPage() {
  const router = useRouter();
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

  const handlePaymentChange = (index: number, field: keyof Omit<Payment, 'date'>, value: string | number) => {
    const newPayments = [...payments];
    const payment = newPayments[index] || {};
    (payment as any)[field] = value;
    newPayments[index] = payment;
    setPayments(newPayments);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving new contribution...");
    router.push('/contributions');
  };

  return (
    <>
      <PageHeader title="تسجيل مساهمة جديدة" />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardDescription>
            استخدم هذا النموذج لتسجيل نذر نقدي أو أي مساهمة مالية أخرى.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
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
                        <Input id={`amount-${index}`} type="number" placeholder="المبلغ" onChange={(e) => handlePaymentChange(index, 'amount', Number(e.target.value))} />
                      </div>
                      <Button
                        type="button"
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
                <Button type="button" variant="outline" size="sm" onClick={handleAddPayment}>
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

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" asChild>
                 <Link href="/contributions">إلغاء</Link>
              </Button>
              <Button type="submit" disabled={!totalAmount || remainingBalance !== 0}>تسجيل المساهمة</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
