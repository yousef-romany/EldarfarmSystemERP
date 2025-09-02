
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { updatePurchase, PurchaseState } from '@/lib/actions/purchase.actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Purchase, Livestock, LivestockType, Barn, Wallet, Payment } from '@prisma/client';

type LivestockData = {
    isBatch: boolean;
    tagId?: string;
    quantity?: number;
    livestockTypeId: string;
    breed: string;
    weight: number;
    age: number;
    barnId: string;
}

type PurchaseWithDetails = Omit<Purchase, 'totalCost'|'amountPaid'|'remainingAmount' | 'livestock' | 'payments' | 'livestockData'> & {
    totalCost: number;
    amountPaid: number;
    remainingAmount: number;
    livestockData: LivestockData;
    livestock: (Omit<Livestock, 'weight'|'cost'> & {
        weight: number;
        cost: number;
    }) | null;
    payments: (Omit<Payment, 'amount'> & { amount: number, wallet: Wallet })[];
};

type EditPurchasePageProps = {
    purchase: PurchaseWithDetails;
    barns: Barn[];
    livestockTypes: LivestockType[];
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

export default function EditPurchasePageClient({ purchase, barns, livestockTypes, wallets }: EditPurchasePageProps) {
    const router = useRouter();
    const { toast } = useToast();
    
    const updatePurchaseWithId = updatePurchase.bind(null, purchase.id);
    const [updateState, updateFormAction] = useActionState<PurchaseState, FormData>(updatePurchaseWithId, { message: null, errors: {}, success: false });

    // Component state initialized from purchase prop
    const [registrationType, setRegistrationType] = useState(purchase.livestockData.isBatch ? 'batch' : 'individual');
    const [payments, setPayments] = useState<Partial<PaymentState[]>>(purchase.payments.map(p => ({ id: p.id, walletId: p.walletId, amount: p.amount })));
    const [totalCost, setTotalCost] = useState(purchase.totalCost);

    const totalPaid = payments.reduce((acc, p) => acc + (p?.amount || 0), 0);
    const remainingBalance = totalCost - totalPaid;
    
    useEffect(() => {
        if (updateState.success) {
            toast({ title: 'نجاح', description: updateState.message });
            router.push('/purchases');
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
    
    if (!purchase) {
        return <div>جاري تحميل بيانات الشراء...</div>;
    }

  return (
    <>
      <div className='flex items-center gap-4 mb-6'>
          <Button variant="outline" size="icon" asChild>
            <Link href="/purchases">
                <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader title={`تعديل مسودة الشراء #${purchase.id.substring(0,8)}`} className='mb-0' />
      </div>
      <Card>
        <CardHeader>
          <CardDescription>
            قم بتحديث بيانات مسودة الشراء أدناه.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" action={updateFormAction}>
            <input type="hidden" name="isBatch" value={String(registrationType === 'batch')} />
            <input type="hidden" name="payments" value={JSON.stringify(payments.filter(p => p.walletId && p.amount))} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="purchaseDate">تاريخ الشراء</Label>
                    <Input name="purchaseDate" id="purchaseDate" type="date" defaultValue={format(new Date(purchase.purchaseDate), 'yyyy-MM-dd')} required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="supplier">المورد (اختياري)</Label>
                    <Input name="supplier" id="supplier" defaultValue={purchase.supplier || ''} placeholder="اسم المورد أو السوق" />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>نوع التسجيل</Label>
                <RadioGroup name="registrationType" value={registrationType} onValueChange={setRegistrationType} className="flex gap-4">
                    <RadioGroupItem value="individual" id="r-individual" />
                    <Label htmlFor="r-individual">حيوان فردي</Label>
                    <RadioGroupItem value="batch" id="r-batch" />
                    <Label htmlFor="r-batch">دفعة</Label>
                </RadioGroup>
            </div>
            
            <Card>
                <CardHeader><CardTitle className="text-lg">تفاصيل الحيوانات</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {registrationType === 'individual' && (
                      <div className="grid gap-2">
                        <Label htmlFor="tagId">الرقم التعريفي</Label>
                        <Input name="tagId" id="tagId" defaultValue={purchase.livestockData.tagId || ''} placeholder="e.g., COW-005" />
                      </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="livestockTypeId">النوع</Label>
                        <Select name="livestockTypeId" defaultValue={purchase.livestockData.livestockTypeId} required>
                        <SelectTrigger id="livestockTypeId"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                        <SelectContent>{livestockTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="breed">السلالة</Label>
                        <Input name="breed" id="breed" defaultValue={purchase.livestockData.breed} placeholder="e.g., هولشتاين" required />
                    </div>
                    {registrationType === 'batch' && (
                      <div className="grid gap-2">
                        <Label htmlFor="quantity">الكمية</Label>
                        <Input name="quantity" id="quantity" type="number" defaultValue={purchase.livestockData.quantity || ''} placeholder="عدد الرؤوس في الدفعة" required />
                      </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="weight">الوزن (كجم)</Label>
                        <Input name="weight" id="weight" type="number" defaultValue={purchase.livestockData.weight} placeholder={registrationType === 'individual' ? "وزن الحيوان" : "متوسط وزن الرأس"} required />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="age">العمر (أشهر)</Label>
                        <Input name="age" id="age" type="number" defaultValue={purchase.livestockData.age} placeholder="e.g., 18" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="barnId">العنبر</Label>
                        <Select name="barnId" defaultValue={purchase.livestockData.barnId} required>
                            <SelectTrigger id="barnId"><SelectValue placeholder="اختر عنبر التسكين" /></SelectTrigger>
                            <SelectContent>{barns.map(b => <SelectItem key={b.id} value={b.id}>{b.name} (المتاح: {b.capacity - b.currentOccupancy})</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader><CardTitle className="text-lg">التكلفة والدفع</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="totalCost">التكلفة الإجمالية</Label>
                        <Input name="totalCost" id="totalCost" type="number" value={totalCost} placeholder="التكلفة الإجمالية للشراء" required onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)}/>
                    </div>
                     <div className="space-y-3">
                        {payments.map((payment, index) => (
                        <div key={index} className="flex items-end gap-2 p-2 border rounded-md">
                            <div className="grid gap-2 flex-1">
                            <Label htmlFor={`wallet-${index}`}>المحفظة / الحساب</Label>
                            <Select value={payment?.walletId} onValueChange={(value) => handlePaymentChange(index, 'walletId', value)}>
                                <SelectTrigger id={`wallet-${index}`}><SelectValue placeholder="اختر محفظة..." /></SelectTrigger>
                                <SelectContent>
                                {wallets.map((wallet) => (
                                    <SelectItem key={wallet.id} value={wallet.id}>{wallet.name} (الرصيد: {wallet.balance.toLocaleString()})</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            </div>
                            <div className="grid gap-2">
                            <Label htmlFor={`amount-${index}`}>المبلغ</Label>
                            <Input id={`amount-${index}`} type="number" placeholder="المبلغ" value={payment?.amount || ''} onChange={(e) => handlePaymentChange(index, 'amount', Number(e.target.value))} />
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePayment(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                        ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddPayment}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        إضافة دفعة أخرى
                    </Button>
                     <div className='flex justify-between items-center p-3 bg-muted rounded-md mb-2'>
                        <span className='font-semibold'>الإجمالي المدفوع:</span>
                        <span className='font-bold text-lg'>{new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(totalPaid)}</span>
                    </div>
                    <div className='flex justify-between items-center p-3 bg-muted rounded-md'>
                        <span className='font-semibold'>الفرق:</span>
                        <span className={`font-bold text-lg ${remainingBalance === 0 ? 'text-green-600' : 'text-destructive'}`}>{new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(remainingBalance)}</span>
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
                    <Link href="/purchases">إلغاء</Link>
                </Button>
                <SubmitButton disabled={!totalCost || remainingBalance !== 0} />
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
