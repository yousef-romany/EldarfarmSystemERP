'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { useState, useEffect, useActionState } from 'react';
import Link from 'next/link';
import { ChevronRight, PlusCircle, Trash2, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Expense, Wallet, Payment } from '@prisma/client';
import { updateExpense, ExpenseState } from '@/lib/actions/expense.actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ExpenseWithDetails = Omit<Expense, 'amount'> & {
    amount: number;
    payments: (Omit<Payment, 'amount'> & { amount: number, wallet: Wallet })[];
};

type EditExpensePageProps = {
    expense: ExpenseWithDetails;
    wallets: Wallet[];
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

export default function EditExpensePage({ expense, wallets }: EditExpensePageProps) {
    const router = useRouter();
    const { toast } = useToast();
    
    // Render a loading state or nothing until the expense data is loaded
    if (!expense) {
        return <div>جاري تحميل بيانات المصروف...</div>;
    }

    // The action is now always bound with the ID from props
    const updateExpenseWithId = updateExpense.bind(null, expense.id);
    const [updateState, updateFormAction] = useActionState(updateExpenseWithId, { message: null, errors: {}, success: false });

    const [description, setDescription] = useState(expense.description);
    const [date, setDate] = useState(format(new Date(expense.date), 'yyyy-MM-dd'));
    const [category, setCategory] = useState<Expense['category'] | ''>(expense.category);
    const [totalAmount, setTotalAmount] = useState(expense.amount);
    const [payments, setPayments] = useState<PaymentState[]>(expense.payments.map(p => ({ id: p.id, walletId: p.walletId, amount: p.amount })));
    
    const totalPaid = payments.reduce((acc, p) => acc + (p?.amount || 0), 0);
    const remainingBalance = totalAmount - totalPaid;
    
    useEffect(() => {
        if (updateState.success) {
            toast({ title: 'نجاح', description: updateState.message });
            router.push('/expenses');
        }
    }, [updateState, toast, router]);

    const handleAddPayment = () => {
        setPayments([...payments, { walletId: '', amount: 0 }]);
    };

    const handleRemovePayment = (index: number) => {
        const newPayments = [...payments];
        newPayments.splice(index, 1);
        setPayments(newPayments);
    };

    const handlePaymentChange = (index: number, field: keyof Omit<PaymentState, 'id'>, value: string | number) => {
        const newPayments = [...payments.map(p => ({...p}))];
        const payment = newPayments[index];
        if (payment) {
            (payment as any)[field] = value;
            setPayments(newPayments);
        }
    };

  return (
    <>
      <div className='flex items-center gap-4 mb-6'>
          <Button variant="outline" size="icon" asChild>
            <Link href="/expenses">
                <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader title={`تعديل المصروف #${expense.id.substring(0,8)}`} className='mb-0' />
      </div>
      <Card>
        <CardHeader>
          <CardDescription>
            قم بتحديث بيانات المصروف أدناه.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" action={updateFormAction}>
            <input type="hidden" name="payments" value={JSON.stringify(payments.filter(p => p?.walletId && p.amount))} />
            <input type="hidden" name="description" value={description} />
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="amount" value={totalAmount} />


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="expense-date">التاريخ</Label>
                    <Input id="expense-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="expense-category">النوع</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                        <SelectTrigger id="expense-category">
                        <SelectValue placeholder="اختر نوع المصروف" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Feed">علف</SelectItem>
                        <SelectItem value="Vet">بيطري</SelectItem>
                        <SelectItem value="Maintenance">صيانة</SelectItem>
                        <SelectItem value="Other">أخرى</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="expense-description">الوصف</Label>
                <Input id="expense-description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <Card>
                <CardHeader>
                  <CardTitle className="text-lg">تفاصيل التكلفة والدفع</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="totalAmount">المبلغ الإجمالي (ج.م)</Label>
                        <Input id="totalAmount" type="number" value={totalAmount} onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)} />
                    </div>
                </CardContent>
                 <CardContent className='space-y-4'>
                    <Label>الدفعات المسجلة</Label>
                    <div className="space-y-3">
                    {payments.map((payment, index) => (
                        <div key={payment.id || index} className="flex items-end gap-2 p-2 border rounded-md">
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
                            <Input id={`amount-${index}`} type="number" placeholder="المبلغ" value={payment.amount || ''} onChange={(e) => handlePaymentChange(index, 'amount', Number(e.target.value))} />
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
                    <Link href="/expenses">إلغاء</Link>
                </Button>
                <SubmitButton disabled={remainingBalance !== 0} />
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
