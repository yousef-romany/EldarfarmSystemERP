
'use client';
import { useEffect, useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { PlusCircle, Trash2, AlertTriangle, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import type { Wallet, Contribution, Payment } from '@prisma/client';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { updateContribution } from '@/lib/actions/contribution.actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ContributionWithDetails = Omit<Contribution, 'totalAmount'> & {
    totalAmount: number;
    payments: (Omit<Payment, 'amount'> & { amount: number; wallet: Omit<Wallet, 'balance'> & { balance: number } })[];
};

type EditContributionPageProps = {
    contribution: ContributionWithDetails;
    wallets: (Omit<Wallet, 'balance'> & { balance: number })[];
}

type PaymentState = {
  id?: string;
  walletId: string;
  amount: number;
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending || disabled}>
            {pending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </Button>
    )
}

export default function EditContributionForm({ contribution, wallets }: EditContributionPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [updateState, updateFormAction] = useActionState(updateContribution.bind(null, contribution.id), { message: null, errors: {}, success: false });

  const [donorName, setDonorName] = useState(contribution.donorName);
  const [description, setDescription] = useState(contribution.description);
  const [date, setDate] = useState(format(new Date(contribution.date), 'yyyy-MM-dd'));
  const [totalAmount, setTotalAmount] = useState(contribution.totalAmount);
  const [payments, setPayments] = useState<Partial<PaymentState[]>>(contribution.payments.map(p => ({ id: p.id, walletId: p.walletId, amount: p.amount })));
  
  const totalPaid = payments.reduce((acc, p) => acc + (p?.amount || 0), 0);
  const remainingBalance = totalAmount - totalPaid;

  useEffect(() => {
    if (updateState.success) {
        toast({ title: 'نجاح', description: updateState.message });
        router.push('/contributions');
    }
  }, [updateState, toast, router]);

  const handleAddPayment = () => {
    setPayments([...payments, {}]);
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };

  const handlePaymentChange = (index: number, field: keyof Omit<PaymentState, 'id'>, value: string | number) => {
    const newPayments = [...payments.map(p => ({...p}))];
    const payment = newPayments[index] || {};
    (payment as any)[field] = value;
    newPayments[index] = payment;
    setPayments(newPayments);
  };

  return (
    <>
      <div className='flex items-center gap-4 mb-6'>
          <Button variant="outline" size="icon" asChild>
            <Link href="/contributions">
                <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader title={`تعديل النذر النقدي #${contribution.id.substring(0,8)}`} className='mb-0' />
      </div>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardDescription>
            قم بتحديث بيانات النذر النقدي أدناه.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" action={updateFormAction}>
            <input type="hidden" name="payments" value={JSON.stringify(payments.filter(p => p.walletId && p.amount))} />
            <input type="hidden" name="totalAmount" value={totalAmount} />
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="donorName" value={donorName} />
            <input type="hidden" name="description" value={description} />
            
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
                    <div key={payment?.id || index} className="flex items-end gap-2 p-2 border rounded-md">
                      <div className="grid gap-2 flex-1">
                        <Label htmlFor={`wallet-${index}`}>المحفظة / الحساب</Label>
                        <Select value={payment?.walletId} onValueChange={(value) => handlePaymentChange(index, 'walletId', value)}>
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
                        <Input id={`amount-${index}`} type="number" value={payment?.amount || ''} placeholder="المبلغ" onChange={(e) => handlePaymentChange(index, 'amount', Number(e.target.value))} />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePayment(index)}
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

             {updateState.message && !updateState.success && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>خطأ في التحديث</AlertTitle>
                    <AlertDescription>
                        {updateState.message}
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex justify-end gap-2">
                <Button variant="outline" asChild type="button">
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
