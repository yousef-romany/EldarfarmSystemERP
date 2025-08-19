'use client';
import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { createPurchase } from '@/lib/actions/purchase.actions';
import type { Barn, LivestockType, Wallet, Purchase, Livestock } from '@prisma/client';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type PurchaseWithDetails = Purchase & {
  livestock: Livestock & {
    livestockType: LivestockType;
    barn: Barn;
  };
};

type PaymentDetails = {
  walletId: string;
  amount: number;
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? 'جاري الحفظ...' : 'حفظ عملية الشراء'}
    </Button>
  );
}

export default function PurchasesPageClient({ barns, livestockTypes, wallets, purchases }: { barns: Barn[], livestockTypes: LivestockType[], wallets: Wallet[], purchases: PurchaseWithDetails[] }) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [createState, createFormAction] = useFormState(createPurchase, { message: null, errors: {}, success: false });

  const [registrationType, setRegistrationType] = useState('individual');
  const [payments, setPayments] = useState<Partial<PaymentDetails[]>>([{}]);
  const [totalCost, setTotalCost] = useState<number>(0);

  const totalPaid = payments.reduce((acc, p) => acc + (p?.amount || 0), 0);
  const remainingBalance = totalCost - totalPaid;

  useEffect(() => {
    if (createState.success) {
      toast({ title: 'نجاح', description: createState.message });
      setIsAddDialogOpen(false);
      resetFormState();
    } else if (createState.message && !createState.success) {
      toast({ title: 'خطأ', description: createState.message, variant: 'destructive' });
    }
  }, [createState, toast]);

  const resetFormState = () => {
    setRegistrationType('individual');
    setPayments([{}]);
    setTotalCost(0);
  };
  
  const handleOpenDialog = () => {
      resetFormState();
      setIsAddDialogOpen(true);
  }

  const handleAddPayment = () => {
    setPayments([...payments, {}]);
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };
  
  const handlePaymentChange = (index: number, field: keyof PaymentDetails, value: string | number) => {
    const newPayments = [...payments.map(p => ({...p}))] as PaymentDetails[];
    const payment = newPayments[index] || {};
    (payment as any)[field] = value;
    newPayments[index] = payment;
    setPayments(newPayments);
  };

  return (
    <>
      <Tabs defaultValue="list" dir="rtl">
        <div className='flex justify-between items-center mb-4'>
            <TabsList className="grid grid-cols-2">
                <TabsTrigger value="list">سجل المشتريات</TabsTrigger>
                <TabsTrigger value="new">إضافة عملية شراء</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>قائمة عمليات الشراء</CardTitle>
              <CardDescription>عرض لجميع عمليات الشراء المسجلة.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الحيوان/الدفعة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المورد</TableHead>
                    <TableHead>التكلفة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map(p => (
                    <TableRow key={p.id}>
                        <TableCell>{format(new Date(p.purchaseDate), 'yyyy-MM-dd')}</TableCell>
                        <TableCell className="font-medium">{p.livestock.isBatch ? `${p.livestock.quantity} رأس` : p.livestock.tagId}</TableCell>
                        <TableCell>{p.livestock.livestockType.name}</TableCell>
                        <TableCell>{p.supplier || 'غير محدد'}</TableCell>
                        <TableCell>{new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(p.totalCost.toNumber())}</TableCell>
                    </TableRow>
                  ))}
                   {purchases.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          لم يتم تسجيل أي عمليات شراء بعد.
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>تسجيل عملية شراء جديدة</CardTitle>
              <CardDescription>املأ النموذج أدناه لتسجيل حيوانات تم شراؤها.</CardDescription>
            </CardHeader>
            <CardContent>
               <form className="grid gap-6" action={createFormAction}>
                  <input type="hidden" name="isBatch" value={String(registrationType === 'batch')} />
                  <input type="hidden" name="payments" value={JSON.stringify(payments.filter(p => p.walletId && p.amount))} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="grid gap-2">
                        <Label htmlFor="purchaseDate">تاريخ الشراء</Label>
                        <Input name="purchaseDate" id="purchaseDate" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required />
                     </div>
                     <div className="grid gap-2">
                        <Label htmlFor="supplier">المورد (اختياري)</Label>
                        <Input name="supplier" id="supplier" placeholder="اسم المورد أو السوق" />
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
                            <Input name="tagId" id="tagId" placeholder="e.g., COW-005" />
                          </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="livestockTypeId">النوع</Label>
                            <Select name="livestockTypeId" required>
                            <SelectTrigger id="livestockTypeId"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                            <SelectContent>{livestockTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="breed">السلالة</Label>
                            <Input name="breed" id="breed" placeholder="e.g., هولشتاين" required />
                        </div>
                        {registrationType === 'batch' && (
                          <div className="grid gap-2">
                            <Label htmlFor="quantity">الكمية</Label>
                            <Input name="quantity" id="quantity" type="number" placeholder="عدد الرؤوس في الدفعة" required />
                          </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="weight">الوزن (كجم)</Label>
                            <Input name="weight" id="weight" type="number" placeholder={registrationType === 'individual' ? "وزن الحيوان" : "متوسط وزن الرأس"} required />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="age">العمر (أشهر)</Label>
                            <Input name="age" id="age" type="number" placeholder="e.g., 18" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="barnId">العنبر</Label>
                            <Select name="barnId" required>
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
                            <Input name="totalCost" id="totalCost" type="number" placeholder="التكلفة الإجمالية للشراء" required onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)}/>
                        </div>
                         <div className="space-y-3">
                            {payments.map((payment, index) => (
                            <div key={index} className="flex items-end gap-2 p-2 border rounded-md">
                                <div className="grid gap-2 flex-1">
                                <Label htmlFor={`wallet-${index}`}>المحفظة / الحساب</Label>
                                <Select onValueChange={(value) => handlePaymentChange(index, 'walletId', value)}>
                                    <SelectTrigger id={`wallet-${index}`}><SelectValue placeholder="اختر محفظة..." /></SelectTrigger>
                                    <SelectContent>
                                    {wallets.map((wallet) => (
                                        <SelectItem key={wallet.id} value={wallet.id}>{wallet.name} (الرصيد: {wallet.balance.toNumber().toLocaleString()})</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                </div>
                                <div className="grid gap-2">
                                <Label htmlFor={`amount-${index}`}>المبلغ</Label>
                                <Input id={`amount-${index}`} type="number" placeholder="المبلغ" value={payment.amount || ''} onChange={(e) => handlePaymentChange(index, 'amount', Number(e.target.value))} />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePayment(index)} disabled={payments.length === 1}>
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

                 <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button">إلغاء</Button>
                    <SubmitButton disabled={!totalCost || remainingBalance !== 0} />
                </div>
               </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
