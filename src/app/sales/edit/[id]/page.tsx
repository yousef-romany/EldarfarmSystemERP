
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sales, livestock } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { useState, useEffect } from 'react';
import type { Livestock, Sale } from '@/lib/types';
import Link from 'next/link';
import { ChevronRight, ChevronsUpDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';


export default function EditSalePage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [sale, setSale] = useState<Sale | null>(null);
    const [selectedAnimal, setSelectedAnimal] = useState<Livestock | null>(null);
    const [initialWeight, setInitialWeight] = useState<number>(0);
    const [pricePerKg, setPricePerKg] = useState<number>(0);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [deposit, setDeposit] = useState<number>(0);
    const [customerName, setCustomerName] = useState('');
    const [comboboxOpen, setComboboxOpen] = useState(false);

    useEffect(() => {
        const saleData = sales.find(s => s.id === id);
        if (saleData) {
            setSale(saleData);
            const animalData = livestock.find(a => a.id === saleData.animalId);
            setSelectedAnimal(animalData || null);
            setInitialWeight(saleData.initialWeight || 0);
            setPricePerKg(saleData.pricePerKg || 0);
            setTotalPrice(saleData.totalPrice || 0);
            setDeposit(saleData.deposit || 0);
            setCustomerName(saleData.customerName || '');
        }
    }, [id]);

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

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Here you would typically handle the form submission, e.g., by calling an API.
      console.log('Updated Sale:', {
          ...sale,
          animalId: selectedAnimal?.id,
          customerName,
          initialWeight,
          pricePerKg,
          totalPrice,
          deposit,
      });
      router.push('/sales');
  }

  if (!sale) {
    return <div>جاري تحميل البيانات...</div>;
  }

  return (
    <>
      <div className='flex items-center gap-4 mb-6'>
          <Button variant="outline" size="icon" asChild>
            <Link href="/sales">
                <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader title={`تعديل عملية البيع #${sale.id}`} className='mb-0' />
      </div>
      <Card>
        <CardHeader>
          <CardDescription>
            قم بتحديث بيانات عملية البيع أدناه.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="animal-select">الحيوان</Label>
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
                                .filter((a) => a.status === 'Available' || a.id === selectedAnimal?.id)
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
                    <Label htmlFor="customer-name">اسم العميل</Label>
                    <Input id="customer-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="اسم المشتري" />
                </div>
            </div>

            {selectedAnimal && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">تفاصيل السعر</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="initial-weight">الوزن الأولي (كجم)</Label>
                    <Input id="initial-weight" type="number" value={initialWeight} onChange={(e) => setInitialWeight(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price-per-kg">سعر الكيلو (ج.م)</Label>
                    <Input id="price-per-kg" type="number" value={pricePerKg} placeholder="أدخل سعر الكيلو" onChange={(e) => setPricePerKg(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="total-price">السعر الإجمالي</Label>
                    <Input id="total-price" type="number" value={totalPrice} onChange={(e) => setTotalPrice(parseFloat(e.target.value) || 0)} />
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid gap-2">
                <Label htmlFor="deposit">العربون (ج.م)</Label>
                <Input id="deposit" type="number" value={deposit} placeholder="المبلغ المدفوع مقدماً" onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)} />
            </div>

             <div className="flex justify-end gap-2">
                <Button variant="outline" asChild type="button">
                    <Link href="/sales">إلغاء</Link>
                </Button>
                <Button type="submit">حفظ التعديلات</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
