
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { livestock, wallets } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { useState, useEffect } from 'react';
import type { Livestock, Payment } from '@/lib/types';
import Link from 'next/link';
import { ChevronRight, ChevronsUpDown, Check, PlusCircle, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function NewDeferredSalePage() {
  const [selectedAnimal, setSelectedAnimal] = useState<Livestock | null>(null);
  const [initialWeight, setInitialWeight] = useState<number>(0);
  const [pricePerKg, setPricePerKg] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [payments, setPayments] = useState<Partial<Payment[]>>([{}]);

  const totalDeposit = payments.reduce((acc, p) => acc + (p?.amount || 0), 0);


  useEffect(() => {
    if (selectedAnimal) {
      setTotalPrice(initialWeight * pricePerKg);
    } else {
      setTotalPrice(0);
    }
  }, [selectedAnimal, initialWeight, pricePerKg]);

  const handleAnimalSelect = (animalId: string) => {
    const animal = livestock.find(a => a.id === animalId);
    setSelectedAnimal(animal || null);
    if (animal) {
      setInitialWeight(animal.weight);
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
          <form className="grid gap-6">
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
                            ? `${selectedAnimal.tagId} - ${selectedAnimal.type === 'Cow' ? 'بقرة' : 'خروف'} - ${selectedAnimal.weight} كجم`
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
                              {livestock
                                .filter((a) => a.status === 'Available')
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
                                    {animal.tagId} - {animal.type === 'Cow' ? 'بقرة' : 'خروف'} - {animal.weight} كجم
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
                    <Input id="deferred-customer-name" placeholder="اسم المشتري" />
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
                    <Input id="deferred-initial-weight" type="number" value={initialWeight} onChange={(e) => setInitialWeight(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deferred-price-per-kg">سعر الكيلو (ج.م)</Label>
                    <Input id="deferred-price-per-kg" type="number" placeholder="أدخل سعر الكيلو" onChange={(e) => setPricePerKg(parseFloat(e.target.value) || 0)} />
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
                  <span className='font-semibold'>إجمالي العربون المدفوع:</span>
                  <span className='font-bold text-lg'>
                    {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(totalDeposit)}
                  </span>
                </div>
              </CardContent>
            </Card>

             <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                    <Link href="/sales">إلغاء</Link>
                </Button>
                <Button disabled={!selectedAnimal || !totalPrice || totalDeposit === 0}>حفظ العملية</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
