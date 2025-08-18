
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { Payment, Contribution } from '@/lib/types';
import { wallets, contributions } from '@/lib/data';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

export default function EditContributionPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [contribution, setContribution] = useState<Contribution | null>(null);
  const [payments, setPayments] = useState<Partial<Payment[]>>([{}]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [donorName, setDonorName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const contributionData = contributions.find(c => c.id === id);
    if (contributionData) {
      setContribution(contributionData);
      setDonorName(contributionData.donorName);
      setDescription(contributionData.description);
      setDate(format(new Date(contributionData.date), 'yyyy-MM-dd'));
      setTotalAmount(contributionData.totalAmount);
      setPayments(contributionData.payments);
    }
  }, [id]);

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
    const newPayments = [...payments.map(p => ({...p}))];
    const payment = newPayments[index] || {};
    (payment as any)[field] = value;
    newPayments[index] = payment;
    setPayments(newPayments);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updating contribution...");
    router.push('/contributions');
  }

  if (!contribution) {
    return <div>جاري تحميل البيانات...</div>
  }

  return (
    <>
      <PageHeader title={`تعديل المساهمة #${contribution.id}`} />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardDescription>
            قم بتحديث بيانات المساهمة النقدية أدناه.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="donor-name">اسم المانح</Label>
                  <Input id="donor-name" value={donorName} onChange={e => setDonorName(e.target.value)} />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="total-amount">المبلغ الإجمالي</Label>
                  <Input id="total-amount" type="number" value={totalAmount} onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">تاريخ الاستلام</Label>
                  <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
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
                        <Select value={payment.walletId} onValueChange={(value) => handlePaymentChange(index, 'walletId', value)}>
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
                        <Input id={`amount-${index}`} type="number" value={payment.amount} placeholder="المبلغ" onChange={(e) => handlePaymentChange(index, 'amount', Number(e.target.value))} />
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
                <Button variant="outline" asChild type="button">
                    <Link href="/contributions">إلغاء</Link>
                </Button>
                <Button type="submit" disabled={!totalAmount || remainingBalance !== 0}>حفظ التعديلات</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

