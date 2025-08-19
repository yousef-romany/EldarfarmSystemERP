
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import type { Vow, Livestock, LivestockType, Barn } from '@prisma/client';
import { format } from 'date-fns';

type VowWithDetails = Vow & {
    livestock: Livestock & {
        livestockType: LivestockType;
    };
};

// This page needs to fetch its own data or receive it from a server component parent.
// For now, it's a placeholder for the edit functionality.

export default function EditVowPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  // In a real app, you would fetch this data from the server based on the ID.
  const [vow, setVow] = useState<VowWithDetails | null>(null);
  const [barns, setBarns] = useState<Barn[]>([]);
  const [livestockTypes, setLivestockTypes] = useState<LivestockType[]>([]);
  const [registrationType, setRegistrationType] = useState('individual');

  useEffect(() => {
    // Placeholder: In a real scenario, you'd fetch this data.
    // e.g., getVowDetails(id).then(data => setVow(data));
    // For now, we'll just show a loading state.
  }, [id]);

  if (!vow) {
    return <div>جاري تحميل بيانات النذر... (صفحة تعديل تحت الإنشاء)</div>;
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving updated vow...");
    // Here you would call an update server action.
    router.push('/vows');
  }

  return (
    <>
      <PageHeader title={`تعديل النذر - ${vow.receiptId}`} />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>تفاصيل النذر</CardTitle>
          <CardDescription>قم بتحديث بيانات النذر أدناه.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" onSubmit={handleSubmit}>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="grid gap-2">
                  <Label htmlFor="donor-name">اسم الناذر</Label>
                  <Input id="donor-name" defaultValue={vow.donorName} placeholder="e.g., يوسف نادر" />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="receipt-id">رقم الإيصال</Label>
                  <Input id="receipt-id" defaultValue={vow.receiptId || ''} placeholder="e.g., 2024-00123" />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>نوع التسجيل</Label>
                <RadioGroup value={vow.livestock.isBatch ? 'batch' : 'individual'} onValueChange={setRegistrationType} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="r-individual" />
                        <Label htmlFor="r-individual">حيوان فردي</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="batch" id="r-batch" />
                        <Label htmlFor="r-batch">دفعة</Label>
                    </div>
                </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!vow.livestock.isBatch && (
                <div className="grid gap-2">
                  <Label htmlFor="tagId">الرقم التعريفي (إن وجد)</Label>
                  <Input id="tagId" defaultValue={vow.livestock.tagId || ''} placeholder="e.g., COW-004" />
                </div>
              )}
               <div className="grid gap-2">
                <Label htmlFor="type">النوع</Label>
                <Select defaultValue={vow.livestock.livestockTypeId}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                     {livestockTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="breed">السلالة</Label>
                <Input id="breed" defaultValue={vow.livestock.breed} placeholder="e.g., هولشتاين, ساسو" />
              </div>
              {vow.livestock.isBatch && (
                 <div className="grid gap-2">
                    <Label htmlFor="quantity">الكمية</Label>
                    <Input id="quantity" type="number" defaultValue={vow.livestock.quantity || ''} placeholder="e.g., 500" />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="weight">الوزن عند الاستلام (كجم)</Label>
                <Input id="weight" type="number" defaultValue={vow.livestock.weight.toNumber()} placeholder={registrationType === 'individual' ? "e.g., 450" : "متوسط وزن الواحدة"} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">العمر عند الاستلام (أشهر)</Label>
                <Input id="age" type="number" defaultValue={vow.livestock.age} placeholder="e.g., 18" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barn">العنبر</Label>
                <Select defaultValue={vow.livestock.barnId}>
                  <SelectTrigger id="barn">
                    <SelectValue placeholder="اختر العنبر للتسكين" />
                  </SelectTrigger>
                  <SelectContent>
                    {barns.map((barn) => (
                      <SelectItem key={barn.id} value={barn.id}>
                        {barn.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vow-date">تاريخ الاستلام</Label>
                <Input id="vow-date" type="date" defaultValue={format(new Date(vow.date), 'yyyy-MM-dd')} />
              </div>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea id="notes" defaultValue={vow.notes || ''} placeholder="أي ملاحظات إضافية عن الحالة الصحية أو غيرها..."/>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild type="button">
                <Link href="/vows">إلغاء</Link>
              </Button>
              <Button type="submit">حفظ التعديلات</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
