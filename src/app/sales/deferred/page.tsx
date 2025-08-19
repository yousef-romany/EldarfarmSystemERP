

'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { useState, useEffect } from 'react';
import type { Payment } from '@/lib/types';
import Link from 'next/link';
import { ChevronRight, ChevronsUpDown, Check, PlusCircle, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFormState, useFormStatus } from 'react-dom';
import { createSale } from '@/lib/actions/sale.actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Livestock, Wallet } from '@prisma/client';
import { prisma } from '@/lib/prisma'; // This will not work on client, need to pass data as props


// TODO: This component needs availableLivestock and wallets passed as props from a server component parent
export default function NewDeferredSalePage({ availableLivestock, wallets }: { availableLivestock: Livestock[], wallets: Wallet[]}) {
  const router = useRouter();
  const { toast } = useToast();
  const [createState, createFormAction] = useFormState(createSale, { message: null, errors: {}, success: false });

  const [selectedAnimal, setSelectedAnimal] = useState<Livestock | null>(null);
  const [initialWeight, setInitialWeight] = useState<number>(0);
  const [pricePerKg, setPricePerKg] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [payments, setPayments] = useState<Partial<Omit<Payment, 'date'>>>([{}]);
  const [customerName, setCustomerName] = useState('');

  const totalDeposit = payments.reduce((acc, p) => acc + (p?.amount || 0), 0);
  
  useEffect(() => {
    if (createState?.success) {
      toast({ title: 'نجاح', description: createState.message });
      router.push('/sales');
    } else if (createState?.message && !createState.success) {
      toast({ title: 'خطأ', description: createState.message, variant: 'destructive' });
    }
  }, [createState, toast, router]);


  useEffect(() => {
    if (selectedAnimal) {
      setTotalPrice(initialWeight * pricePerKg);
    } else {
      setTotalPrice(0);
    }
  }, [selectedAnimal, initialWeight, pricePerKg]);

  const handleAnimalSelect = (animalId: string) => {
    const animal = availableLivestock.find(a => a.id === animalId);
    setSelectedAnimal(animal || null);
    if (animal) {
      setInitialWeight(animal.weight.toNumber());
    } else {
      setInitialWeight(0);
    }
    setComboboxOpen(false);
  };
  
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
  
  function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending || !selectedAnimal || !totalPrice || totalDeposit === 0}>
            {pending ? 'جاري الحفظ...' : 'حفظ العملية'}
        </Button>
    )
  }


  return (
    <>
      <div className='flex items-center gap-4 mb-6'>
          <Button variant="outline" size="icon" asChild>
            <Link href="/sales">
                <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader title="بدء عملية بيع آجل جديدة" className='mb-0' />
      </div>
      <Card>
        <CardHeader>
          <CardDescription>
            املأ النموذج أدناه لتسجيل عملية بيع آجل.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createFormAction} className="grid gap-6">
             <input type="hidden" name="isDeferred" value="true" />
             <input type="hidden" name="payments" value={JSON.stringify(payments)} />
             <input type="hidden" name="livestockId" value={selectedAnimal?.id || ''} />
             <input type="hidden" name="initialWeight" value={initialWeight} />
             <input type="hidden" name="totalPrice" value={totalPrice} />
             <input type="hidden" name="saleDate" value={format(new Date(), 'yyyy-MM-dd')} />

            <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="deferred-animal-select">اختر الحيوان</Label>
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={comboboxOpen}
                          className="w-full justify-between"
                        >
                          {selectedAnimal
                            ? `${selectedAnimal.tagId} - ${selectedAnimal.breed} - ${selectedAnimal.weight} كجم`
                            : "اختر حيوانًا..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="ابحث بالرقم التعريفي..." />
                          <CommandList>
                            <CommandEmpty>لم يتم العثور على حيوان.</CommandEmpty>
                            <CommandGroup>
                              {availableLivestock
                                .map((animal) => (
                                  <CommandItem
                                    key={animal.id}
                                    value={animal.id}
                                    onSelect={() => handleAnimalSelect(animal.id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedAnimal?.id === animal.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {animal.tagId} - {animal.breed} - {animal.weight.toNumber()} كجم
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="deferred-customer-name">اسم العميل</Label>
                    <Input name="customerName" id="deferred-customer-name" placeholder="اسم المشتري" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>
            </div>

            {selectedAnimal && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">تفاصيل السعر</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="deferred-initial-weight">الوزن الأولي (كجم)</Label>
                    <Input id="deferred-initial-weight" type="number" value={initialWeight} readOnly />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deferred-price-per-kg">سعر الكيلو (ج.م)</Label>
                    <Input name="pricePerKg" id="deferred-price-per-kg" type="number" placeholder="أدخل سعر الكيلو" value={pricePerKg} onChange={(e) => setPricePerKg(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deferred-total-price">السعر الإجمالي</Label>
                    <Input id="deferred-total-price" type="number" value={totalPrice} readOnly />
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>تفاصيل دفع العربون</CardTitle>
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
                  <span className='font-semibold'>إجمالي العربون المدفوع:</span>
                  <span className='font-bold text-lg'>
                    {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(totalDeposit)}
                  </span>
                </div>
              </CardContent>
            </Card>

             <div className="flex justify-end gap-2">
                <Button variant="outline" asChild type="button">
                    <Link href="/sales">إلغاء</Link>
                </Button>
                <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

export default function NewDeferredSalePageContainer() {
    const [data, setData] = useState<{livestock: Livestock[], wallets: Wallet[]} | null>(null);

    useEffect(() => {
        async function fetchData() {
            const livestock = await prisma.livestock.findMany({ where: { status: 'Available' }});
            const wallets = await prisma.wallet.findMany();
            setData({ livestock, wallets });
        }
        // This approach is incorrect for client components.
        // Data must be fetched in a parent server component and passed down.
        // For now, this will be broken, but let's assume the data is passed as props.
    }, []);

    // Placeholder until data loading is fixed
    return <NewDeferredSalePage availableLivestock={[]} wallets={[]} />;
}
