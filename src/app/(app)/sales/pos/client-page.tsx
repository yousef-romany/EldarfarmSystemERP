
'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { format } from 'date-fns';
import { useState, useEffect, useActionState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ChevronsUpDown, Check, PlusCircle, Trash2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { createSale } from '@/lib/actions/sale.actions';
import type { Livestock, Wallet } from '@prisma/client';
import { useRouter } from 'next/navigation';

type PaymentDetails = {
    walletId: string;
    amount: number;
}


function SubmitButton({ text, disabled }: { text: string, disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} className="w-full">
      {pending ? 'جاري الحفظ...' : text}
    </Button>
  );
}

export default function POSClientPage({ availableLivestock, wallets }: { availableLivestock: Livestock[], wallets: Wallet[]}) {
  const router = useRouter();
  const { toast } = useToast();
  const [createState, createFormAction] = useActionState(createSale, { message: null, errors: {}, success: false });

  // State for Sale
  const [payments, setPayments] = useState<Partial<PaymentDetails>[]>([{}]);
  const [selectedAnimal, setSelectedAnimal] = useState<Livestock | null>(null);
  const [pricePerKg, setPricePerKg] = useState<number>(0);
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');

  const totalPaid = payments.reduce((acc, p) => acc + (p?.amount || 0), 0);
  const remainingBalance = totalPrice - totalPaid;
  
  useEffect(() => {
    if (createState.success) {
      toast({ title: 'نجاح', description: createState.message });
      // Reset form state
      setSelectedAnimal(null);
      setPricePerKg(0);
      setCurrentWeight(0);
      setTotalPrice(0);
      setPayments([{}]);
      setCustomerName('');
      // Optionally redirect to invoice or sales list
      router.push('/sales');
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
  
  const handlePaymentChange = (index: number, field: keyof PaymentDetails, value: string | number) => {
    const newPayments = [...payments.map(p => ({...p}))] as Partial<PaymentDetails>[];
    const payment = newPayments[index] || {};
    (payment as any)[field] = value;
    newPayments[index] = payment;
    setPayments(newPayments);
  };

  useEffect(() => {
    if (selectedAnimal) {
      setTotalPrice(currentWeight * pricePerKg);
    } else {
      setTotalPrice(0);
    }
  }, [selectedAnimal, currentWeight, pricePerKg]);

  const handleAnimalSelect = (animalId: string) => {
    const animal = availableLivestock.find(a => a.id === animalId);
    setSelectedAnimal(animal || null);
    if (animal) {
      setCurrentWeight(animal.weight);
    } else {
      setCurrentWeight(0);
    }
    setComboboxOpen(false);
  };

  return (
    <>
      <PageHeader title="نقطة البيع (فوري)" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side - Form */}
        <div className="md:col-span-2">
            <form action={createFormAction}>
                <Card>
                    <CardHeader>
                        <CardTitle>تفاصيل عملية البيع</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="saleType" value="Immediate" />
                        <input type="hidden" name="payments" value={JSON.stringify(payments.filter(p=>p.walletId && p.amount))} />
                        <input type="hidden" name="livestockId" value={selectedAnimal?.id || ''} />
                        <input type="hidden" name="initialWeight" value={currentWeight} />
                        <input type="hidden name="pricePerKg" value={pricePerKg} />
                        <input type="hidden" name="totalPrice" value={totalPrice} />
                        <input type="hidden" name="saleDate" value={format(new Date(), 'yyyy-MM-dd')} />

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="animal-select">اختر الحيوان</Label>
                                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" aria-expanded={comboboxOpen} className="w-full justify-between">
                                            {selectedAnimal ? `${selectedAnimal.tagId} - ${selectedAnimal.weight} كجم` : "اختر حيوانًا..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="ابحث بالرقم التعريفي..." />
                                            <CommandList>
                                                <CommandEmpty>لم يتم العثور على حيوان.</CommandEmpty>
                                                <CommandGroup>
                                                    {availableLivestock.map((animal) => (
                                                        <CommandItem key={animal.id} value={animal.id} onSelect={() => handleAnimalSelect(animal.id)}>
                                                            <Check className={cn("mr-2 h-4 w-4", selectedAnimal?.id === animal.id ? "opacity-100" : "opacity-0")} />
                                                            {animal.tagId} - {animal.breed} - {animal.weight} كجم
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="customer-name">اسم العميل</Label>
                                <Input name="customerName" id="customer-name" placeholder="اسم المشتري" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                            </div>
                        </div>

                        {selectedAnimal && (
                        <div className='grid md:grid-cols-3 gap-4'>
                            <div className="grid gap-2">
                            <Label htmlFor="current-weight">الوزن الحالي (كجم)</Label>
                            <Input id="current-weight" type="number" value={currentWeight} onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="grid gap-2">
                            <Label htmlFor="price-per-kg">سعر الكيلو (ج.م)</Label>
                            <Input id="price-per-kg" type="number" placeholder="أدخل سعر الكيلو" value={pricePerKg} onChange={(e) => setPricePerKg(parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="grid gap-2">
                            <Label htmlFor="total-price-display">السعر الإجمالي</Label>
                            <Input id="total-price-display" type="number" value={totalPrice} readOnly />
                            </div>
                        </div>
                        )}
                    </CardContent>
                </Card>
             </form>
        </div>

        {/* Right Side - Payment */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>الدفع</CardTitle>
              <CardDescription>أدخل تفاصيل الدفع لتسوية الفاتورة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-3">
                {payments.map((payment, index) => (
                  <div key={index} className="flex items-end gap-2 p-2 border rounded-md">
                    <div className="grid gap-2 flex-1">
                      <Label htmlFor={`wallet-${index}`}>المحفظة</Label>
                      <Select value={payment.walletId} onValueChange={(value) => handlePaymentChange(index, 'walletId', value)}>
                        <SelectTrigger id={`wallet-${index}`}>
                          <SelectValue placeholder="اختر محفظة..." />
                        </SelectTrigger>
                        <SelectContent>
                          {wallets.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`amount-${index}`}>المبلغ</Label>
                      <Input id={`amount-${index}`} type="number" placeholder="المبلغ" value={payment?.amount || ''} onChange={(e) => handlePaymentChange(index, 'amount', Number(e.target.value))} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePayment(index)} disabled={payments.length === 1}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddPayment}>
                <PlusCircle className="mr-2 h-4 w-4" />
                إضافة دفعة
              </Button>
            </CardContent>
            <CardContent>
                <div className='flex justify-between items-center p-3 bg-muted rounded-md mb-2'>
                    <span className='font-semibold'>الإجمالي المدفوع:</span>
                    <span className='font-bold text-lg'>{new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(totalPaid)}</span>
                </div>
                <div className='flex justify-between items-center p-3 bg-muted rounded-md'>
                    <span className='font-semibold'>المبلغ المتبقي:</span>
                    <span className={`font-bold text-lg ${remainingBalance === 0 ? 'text-green-600' : 'text-destructive'}`}>{new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(remainingBalance)}</span>
                </div>
            </CardContent>
            <CardContent>
                 <SubmitButton text="إتمام البيع" disabled={!selectedAnimal || !pricePerKg || remainingBalance !== 0} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
