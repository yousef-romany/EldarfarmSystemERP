'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { useState, useEffect, useActionState } from 'react';
import Link from 'next/link';
import { ChevronRight, PlusCircle, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Sale, Livestock, Wallet, Payment } from '@prisma/client';
import { updateSale } from '@/lib/actions/sale.actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';


type SaleWithDetails = Omit<Sale, 'pricePerKg' | 'totalPrice' | 'amountPaid' | 'remainingAmount' | 'initialWeight' | 'finalWeight' | 'payments' | 'livestock'> & {
    pricePerKg: number;
    totalPrice: number;
    amountPaid: number;
    remainingAmount: number;
    initialWeight: number | null;
    finalWeight: number | null;
    livestock: Livestock;
    payments: (Omit<Payment, 'amount'> & { amount: number, wallet: Wallet })[];
};

type EditSalePageProps = {
    sale: SaleWithDetails;
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

export default function EditSalePage({ sale, wallets }: EditSalePageProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [updateState, updateFormAction] = useActionState(updateSale.bind(null, sale.id), { message: null, errors: {}, success: false });

    const [customerName, setCustomerName] = useState(sale.customerName);
    const [saleDate, setSaleDate] = useState(format(new Date(sale.saleDate), 'yyyy-MM-dd'));
    const [totalPrice, setTotalPrice] = useState(sale.totalPrice);
    const [payments, setPayments] = useState<Partial<PaymentState[]>>(sale.payments.map(p => ({ id: p.id, walletId: p.walletId, amount: p.amount })));
    
    // Use initialWeight for editing drafts
    const [weight, setWeight] = useState(sale.initialWeight || 0);
    const [pricePerKg, setPricePerKg] = useState(sale.pricePerKg || 0);

    // Recalculate total price if details change
    useEffect(() => {
      setTotalPrice(weight * pricePerKg);
    }, [weight, pricePerKg]);

    const totalPaid = payments.reduce((acc, p) => acc + (p?.amount || 0), 0);
    const remainingBalance = totalPrice - totalPaid;

    useEffect(() => {
        if (updateState.success) {
            toast({ title: 'نجاح', description: updateState.message });
            router.push('/sales');
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
    
    const canEdit = sale.status === 'Draft';


  return (
    <>
      <div className='flex items-center gap-4 mb-6'>
          <Button variant="outline" size="icon" asChild>
            <Link href="/sales">
                <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader title={`تعديل مسودة البيع #${sale.id.substring(0,8)}`} className='mb-0' />
      </div>
      <Card>
        <CardHeader>
          <CardDescription>
            قم بتحديث بيانات مسودة البيع أدناه. لا يمكن تعديل العمليات بعد تأكيدها.
            {!canEdit && <span className='font-bold text-destructive'> (تم تأكيد هذه العملية ولا يمكن تعديلها)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" action={updateFormAction}>
             <input type="hidden" name="payments" value={JSON.stringify(payments.filter(p => p.walletId && p.amount))} />
             <input type="hidden" name="totalPrice" value={totalPrice} />
             <input type="hidden" name="pricePerKg" value={pricePerKg} />
             <input type="hidden" name="initialWeight" value={weight} />

             <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>الحيوان</Label>
                    <Input value={`${sale.livestock.tagId || 'دفعة'} - ${sale.livestock.breed}`} disabled />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="customerName">اسم العميل</Label>
                    <Input name="customerName" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="اسم المشتري" disabled={!canEdit} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="saleDate">تاريخ البيع</Label>
                    <Input name="saleDate" id="saleDate" type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} disabled={!canEdit}/>
                </div>
            </div>

            <Card>
                <CardHeader>
                  <CardTitle className="text-lg">تفاصيل السعر والدفع</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="initialWeight">الوزن (كجم)</Label>
                        <Input id="initialWeight" type="number" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} disabled={!canEdit}/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="pricePerKg">سعر الكيلو (ج.م)</Label>
                        <Input id="pricePerKg" type="number" value={pricePerKg} onChange={(e) => setPricePerKg(parseFloat(e.target.value) || 0)} disabled={!canEdit}/>
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="totalPrice">السعر الإجمالي (ج.م)</Label>
                        <Input id="totalPrice" type="number" value={totalPrice} readOnly disabled={!canEdit}/>
                    </div>
                </CardContent>
                 <CardContent className='space-y-4'>
                    <Label>الدفعات المسجلة</Label>
                    <div className="space-y-3">
                    {payments.map((payment, index) => (
                        <div key={payment?.id || index} className="flex items-end gap-2 p-2 border rounded-md">
                        <div className="grid gap-2 flex-1">
                            <Label htmlFor={`wallet-${index}`}>المحفظة / الحساب</Label>
                            <Select value={payment?.walletId} onValueChange={(value) => handlePaymentChange(index, 'walletId', value)} disabled={!canEdit}>
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
                            <Input id={`amount-${index}`} type="number" placeholder="المبلغ" value={payment?.amount || ''} onChange={(e) => handlePaymentChange(index, 'amount', Number(e.target.value))} disabled={!canEdit}/>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemovePayment(index)}
                            disabled={!canEdit}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        </div>
                    ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddPayment} disabled={!canEdit}>
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
                    <Link href="/sales">إلغاء</Link>
                </Button>
                <SubmitButton disabled={!canEdit || remainingBalance !== 0} />
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
