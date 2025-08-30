'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState, useEffect, useActionState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createVow } from '@/lib/actions/vow.actions';
import type { Barn, LivestockType } from '@prisma/client';
import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'جاري الحفظ...' : 'حفظ وتسجيل'}
    </Button>
  );
}

function NewVowForm({ barns, livestockTypes }: { barns: Barn[], livestockTypes: LivestockType[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [createState, createFormAction] = useActionState(createVow, { message: null, errors: {}, success: false });

  const [registrationType, setRegistrationType] = useState('individual');

  useEffect(() => {
    if (createState.success) {
      toast({ title: 'نجاح', description: createState.message });
      router.push('/vows');
    } else if (createState.message && !createState.success) {
      toast({ title: 'خطأ', description: createState.message, variant: 'destructive' });
    }
  }, [createState, toast, router]);

  return (
    <>
      <PageHeader title="تسجيل نذر جديد" />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>تفاصيل النذر</CardTitle>
          <CardDescription>املأ النموذج أدناه لتسجيل حيوان أو دفعة واردة كنذر للدير.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" action={createFormAction}>
            <input type="hidden" name="registrationType" value={registrationType} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="donor-name">اسم الناذر</Label>
                <Input id="donor-name" name="donorName" placeholder="e.g., يوسف نادر" required />
                {createState?.errors?.donorName && <p className="text-xs text-red-500">{createState.errors.donorName[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="receipt-id">رقم الإيصال (اختياري)</Label>
                <Input id="receipt-id" name="receiptId" placeholder="e.g., 2024-00123" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>نوع التسجيل</Label>
              <RadioGroup value={registrationType} onValueChange={setRegistrationType} className="flex gap-4">
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
                  <Label htmlFor="tagId">الرقم التعريفي</Label>
                  <Input id="tagId" name="tagId" placeholder="e.g., COW-004" />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="type">النوع</Label>
                <Select name="livestockTypeId" required>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {livestockTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {createState?.errors?.livestockTypeId && <p className="text-xs text-red-500">{createState.errors.livestockTypeId[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="breed">السلالة</Label>
                <Input id="breed" name="breed" placeholder="e.g., هولشتاين, ساسو" />
                 {createState?.errors?.breed && <p className="text-xs text-red-500">{createState.errors.breed[0]}</p>}
              </div>
              {registrationType === 'batch' && (
                <div className="grid gap-2">
                  <Label htmlFor="quantity">الكمية</Label>
                  <Input id="quantity" name="quantity" type="number" placeholder="e.g., 500" required />
                   {createState?.errors?.quantity && <p className="text-xs text-red-500">{createState.errors.quantity[0]}</p>}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="weight">الوزن عند الاستلام (كجم)</Label>
                <Input id="weight" name="weight" type="number" placeholder={registrationType === 'individual' ? "e.g., 450" : "متوسط وزن الواحدة"} required />
                {createState?.errors?.weight && <p className="text-xs text-red-500">{createState.errors.weight[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">العمر عند الاستلام (أشهر)</Label>
                <Input id="age" name="age" type="number" placeholder="e.g., 18" required />
                 {createState?.errors?.age && <p className="text-xs text-red-500">{createState.errors.age[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barn">العنبر</Label>
                <Select name="barnId" required>
                  <SelectTrigger id="barn">
                    <SelectValue placeholder="اختر العنبر للتسكين" />
                  </SelectTrigger>
                  <SelectContent>
                    {barns?.map((barn) => (
                      <SelectItem key={barn.id} value={barn.id}>
                        {barn.name} (السعة المتاحة: {barn.capacity - barn.currentOccupancy})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {createState?.errors?.barnId && <p className="text-xs text-red-500">{createState.errors.barnId[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vow-date">تاريخ الاستلام</Label>
                <Input id="vow-date" name="date" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                {createState?.errors?.date && <p className="text-xs text-red-500">{createState.errors.date[0]}</p>}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea id="notes" name="notes" placeholder="أي ملاحظات إضافية عن الحالة الصحية أو غيرها..." />
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

export default async function NewVowPageContainer() {
  const barns = await prisma.barn.findMany({ orderBy: { name: 'asc' } });
  const livestockTypes = await prisma.livestockType.findMany({ orderBy: { name: 'asc' }});

  return <NewVowForm barns={barns} livestockTypes={livestockTypes} />;
}