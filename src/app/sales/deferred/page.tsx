
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { livestock } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { useState, useEffect } from 'react';
import type { Livestock } from '@/lib/types';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';


export default function NewDeferredSalePage() {
  const [deferredSelectedAnimal, setDeferredSelectedAnimal] = useState<Livestock | null>(null);
  const [deferredInitialWeight, setDeferredInitialWeight] = useState<number>(0);
  const [deferredPricePerKg, setDeferredPricePerKg] = useState<number>(0);
  const [deferredTotalPrice, setDeferredTotalPrice] = useState<number>(0);

  useEffect(() => {
    if (deferredSelectedAnimal) {
      setDeferredTotalPrice(deferredInitialWeight * deferredPricePerKg);
    } else {
      setDeferredTotalPrice(0);
    }
  }, [deferredSelectedAnimal, deferredInitialWeight, deferredPricePerKg]);

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
          <div className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="deferred-animal-select">اختر الحيوان</Label>
                    <Select onValueChange={(animalId) => {
                        const animal = livestock.find(a => a.id === animalId);
                        setDeferredSelectedAnimal(animal || null);
                        if (animal) {
                        setDeferredInitialWeight(animal.weight);
                        } else {
                        setDeferredInitialWeight(0);
                        }
                    }}>
                    <SelectTrigger id="deferred-animal-select">
                        <SelectValue placeholder="اختر حيوانًا من المتاحين..." />
                    </SelectTrigger>
                    <SelectContent>
                        {livestock
                        .filter((a) => a.status === 'Available')
                        .map((animal) => (
                            <SelectItem key={animal.id} value={animal.id}>
                            {animal.tagId} - {animal.type === 'Cow' ? 'بقرة' : 'خروف'} - {animal.weight} كجم
                            </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="deferred-customer-name">اسم العميل</Label>
                    <Input id="deferred-customer-name" placeholder="اسم المشتري" />
                </div>
            </div>

            {deferredSelectedAnimal && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">تفاصيل السعر</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="deferred-initial-weight">الوزن الأولي (كجم)</Label>
                    <Input id="deferred-initial-weight" type="number" value={deferredInitialWeight} onChange={(e) => setDeferredInitialWeight(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deferred-price-per-kg">سعر الكيلو (ج.م)</Label>
                    <Input id="deferred-price-per-kg" type="number" placeholder="أدخل سعر الكيلو" onChange={(e) => setDeferredPricePerKg(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deferred-total-price">السعر الإجمالي</Label>
                    <Input id="deferred-total-price" type="number" value={deferredTotalPrice} onChange={(e) => setDeferredTotalPrice(parseFloat(e.target.value) || 0)} />
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid gap-2">
                <Label htmlFor="deferred-deposit">العربون (ج.م)</Label>
                <Input id="deferred-deposit" type="number" placeholder="المبلغ المدفوع مقدماً" />
            </div>

             <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                    <Link href="/sales">إلغاء</Link>
                </Button>
                <Button>حفظ العملية</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

