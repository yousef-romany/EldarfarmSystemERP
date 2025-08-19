
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useFormState, useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
// import { updateVow } from '@/lib/actions/vow.actions'; // Action to be created

type VowWithDetails = Vow & {
    livestock: Livestock & {
        livestockType: LivestockType;
    };
};

type EditVowPageProps = {
    vow: VowWithDetails;
    barns: Barn[];
    livestockTypes: LivestockType[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
    </Button>
  );
}

export default function EditVowPage({ vow, barns, livestockTypes }: EditVowPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  // const [updateState, updateFormAction] = useFormState(updateVow.bind(null, vow.id), { message: null, errors: {}, success: false });

  const [registrationType, setRegistrationType] = useState(vow.livestock.isBatch ? 'batch' : 'individual');

  // useEffect(() => {
  //   if (updateState.success) {
  //     toast({ title: 'نجاح', description: updateState.message });
  //     router.push('/vows');
  //   } else if (updateState.message && !updateState.success) {
  //     toast({ title: 'خطأ', description: updateState.message, variant: 'destructive' });
  //   }
  // }, [updateState, toast, router]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder until updateVow action is fully implemented
    toast({
        title: 'تحت الإنشاء',
        description: 'وظيفة تعديل النذور لم يتم تفعيلها بعد.'
    });
    // router.push('/vows');
  }

  return (
    <>
      <PageHeader title={`تعديل النذر - ${vow.receiptId || vow.id}`} />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>تفاصيل النذر</CardTitle>
          <CardDescription>قم بتحديث بيانات النذر أدناه. (ملاحظة: وظيفة الحفظ تحت الإنشاء)</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" onSubmit={handleSubmit}>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="grid gap-2">
                  <Label htmlFor="donor-name">اسم الناذر</Label>
                  <Input name="donorName" id="donor-name" defaultValue={vow.donorName} placeholder="e.g., يوسف نادر" required />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="receipt-id">رقم الإيصال</Label>
                  <Input name="receiptId" id="receipt-id" defaultValue={vow.receiptId || ''} placeholder="e.g., 2024-00123" />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>نوع التسجيل</Label>
                <RadioGroup name="registrationType" value={registrationType} onValueChange={setRegistrationType} className="flex gap-4">
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
              {registrationType === 'individual' && (
                <div className="grid gap-2">
                  <Label htmlFor="tagId">الرقم التعريفي (إن وجد)</Label>
                  <Input name="tagId" id="tagId" defaultValue={vow.livestock.tagId || ''} placeholder="e.g., COW-004" />
                </div>
              )}
               <div className="grid gap-2">
                <Label htmlFor="type">النوع</Label>
                <Select name="livestockTypeId" defaultValue={vow.livestock.livestockTypeId} required>
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
                <Input name="breed" id="breed" defaultValue={vow.livestock.breed} placeholder="e.g., هولشتاين, ساسو" required/>
              </div>
              {registrationType === 'batch' && (
                 <div className="grid gap-2">
                    <Label htmlFor="quantity">الكمية</Label>
                    <Input name="quantity" id="quantity" type="number" defaultValue={vow.livestock.quantity || ''} placeholder="e.g., 500" required/>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="weight">الوزن عند الاستلام (كجم)</Label>
                <Input name="weight" id="weight" type="number" defaultValue={vow.livestock.weight.toNumber()} placeholder={registrationType === 'individual' ? "e.g., 450" : "متوسط وزن الواحدة"} required/>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">العمر عند الاستلام (أشهر)</Label>
                <Input name="age" id="age" type="number" defaultValue={vow.livestock.age} placeholder="e.g., 18" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barn">العنبر</Label>
                <Select name="barnId" defaultValue={vow.livestock.barnId} required>
                  <SelectTrigger id="barn">
                    <SelectValue placeholder="اختر العنبر للتسكين" />
                  </SelectTrigger>
                  <SelectContent>
                    {barns.map((barn) => (
                      <SelectItem key={barn.id} value={barn.id}>
                        {barn.name} (المتاح: {barn.capacity - barn.currentOccupancy})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vow-date">تاريخ الاستلام</Label>
                <Input name="date" id="vow-date" type="date" defaultValue={format(new Date(vow.date), 'yyyy-MM-dd')} required/>
              </div>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea name="notes" id="notes" defaultValue={vow.notes || ''} placeholder="أي ملاحظات إضافية عن الحالة الصحية أو غيرها..."/>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild type="button">
                <Link href="/vows">إلغاء</Link>
              </Button>
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
