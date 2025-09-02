'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { useState, useEffect, useActionState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { createContribution } from '@/lib/actions/contribution.actions';
import type { Wallet } from '@prisma/client';

type Payment = {
  walletId: string;
  amount: number;
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? 'جاري التسجيل...' : 'تسجيل النذر النقدي'}
    </Button>
  );
}

// This is the Client Component that renders the form
export default function NewContributionForm({ wallets }: { wallets: (Omit<Wallet, 'balance'> & { balance: number })[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [createState, createFormAction] = useActionState(createContribution, { message: null, errors: {}, success: false });

  const [payments, setPayments] = useState<Partial<Payment>[]>([{}]);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const totalPaid = payments.reduce((acc, p) => acc + (p?.amount || 0), 0);
  const remainingBalance = totalAmount - totalPaid;

  useEffect(() => {
    if (createState.success) {
      toast({ title: 'نجاح', description: createState.message });
      router.push('/contributions');
    } else if (createState.message && !createState.success) {
      toast({ title: 'خطأ', description: createState.message, variant: 'destructive' });
    }
  }, [createState, toast, router]);

  const handleAddPayment = () => {
    setPayments([...payments, {}]);
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };

  const handlePaymentChange = (index: number, field: keyof Payment, value: string | number) => {
    const newPayments = [...payments.map(p => ({...p}))];
    const payment = newPayments[index] || {};
    (payment as any)[field] = value;
    newPayments[index] = payment;
    setPayments(newPayments);
  };

  return (
    <>
      <PageHeader title="تسجيل نذر نقدي جديد" />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardDescription>
            استخدم هذا النموذج لتسجيل نذر نقدي أو أي تبرع مالي آخر.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" action={createFormAction}>
            {/* Hidden inputs to pass complex state to the server action */}
            <input type="hidden" name="payments" value={JSON.stringify(payments.filter(p => p.walletId && p.amount))} />
            <input type="hidden" name="totalAmount" value={totalAmount} />

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="donor-name">اسم المانح</Label>
                <Input name="donorName" id="donor-name" placeholder="e.g., يوسف رومانى" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea name="description" id="description" placeholder="e.g., نذر بقيمة خروف, تبرع عام" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="total-amount">المبلغ الإجمالي</Label>
                <Input id="total-amount" type="number" placeholder="المبلغ المستلم" required onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">تاريخ الاستلام</Label>
                <Input name="date" id="date" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>تفاصيل الدفع</CardTitle>
                <CardDescription>مجموع الدفعات يجب أن يكون مساويًا للمبلغ الإجمالي.</CardDescription>
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
                            {wallets && wallets.map((wallet) => (
                              <SelectItem key={wallet.id} value={wallet.id}>
                                {wallet.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`amount-${index}`}>المبلغ</Label>
                        <Input id={`amount-${index}`} type="number" placeholder="المبلغ" value={payment.amount || ''} onChange={(e) => handlePaymentChange(index, 'amount', Number(e.target.value))} />
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
                  <span className='font-semibold'>الفرق:</span>
                  <span className={`font-bold text-lg ${remainingBalance === 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(remainingBalance)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" asChild>
                <Link href="/contributions">إلغاء</Link>
              </Button>
              <SubmitButton disabled={!totalAmount || remainingBalance !== 0} />
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}