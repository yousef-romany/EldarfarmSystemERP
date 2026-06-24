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
import { createOpeningBalanceLivestock } from '@/lib/actions/opening-balance.actions';
import type { Barn, LivestockType } from '@prisma/client';
import { format } from 'date-fns';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'جاري الحفظ...' : 'حفظ كرصيد افتتاحي'}
    </Button>
  );
}

export default function OpeningBalanceClientPage({ barns, livestockTypes }: { barns: Barn[], livestockTypes: LivestockType[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [createState, createFormAction] = useActionState(createOpeningBalanceLivestock, { message: null, errors: {}, success: false });

  const [registrationType, setRegistrationType] = useState('individual');
  const [livestockTypeId, setLivestockTypeId] = useState('');
  const [barnId, setBarnId] = useState('');

  useEffect(() => {
    if (createState.success) {
      toast({ title: 'نجاح', description: createState.message });
      // Potentially redirect or clear form
      router.push('/dashboard'); 
    } else if (createState.message && !createState.success) {
      toast({ title: 'خطأ', description: createState.message, variant: 'destructive' });
    }
  }, [createState, toast, router]);

  return (
    <>
      <PageHeader title="إدخال رصيد افتتاحي للمواشي" />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>تسجيل حيوان أو دفعة موجودة</CardTitle>
          <CardDescription>
            استخدم هذا النموذج لإدخال المواشي الموجودة بالفعل في المزرعة. هذه العملية لن تؤثر على السجلات المالية.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" action={createFormAction}>
            <input type="hidden" name="registrationType" value={registrationType} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="grid gap-2">
                <Label htmlFor="entryDate">تاريخ الإدخال</Label>
                <Input id="entryDate" name="entryDate" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                {createState?.errors?.entryDate && <p className="text-xs text-red-500">{createState.errors.entryDate[0]}</p>}
              </div>
               <div className="grid gap-2">
                <Label htmlFor="estimatedCost">التكلفة التقديرية للرأس (ج.م)</Label>
                <Input id="estimatedCost" name="estimatedCost" type="number" step="any" placeholder="e.g., 15000" required defaultValue="0" />
                 {createState?.errors?.estimatedCost && <p className="text-xs text-red-500">{createState.errors.estimatedCost[0]}</p>}
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
                   {createState?.errors?.tagId && <p className="text-xs text-red-500">{createState.errors.tagId[0]}</p>}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="type">النوع</Label>
                <input type="hidden" name="livestockTypeId" value={livestockTypeId} />
                <Select value={livestockTypeId} onValueChange={setLivestockTypeId} required>
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
                  <Input id="quantity" name="quantity" type="number" placeholder="e.g., 50" required />
                   {createState?.errors?.quantity && <p className="text-xs text-red-500">{createState.errors.quantity[0]}</p>}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="weight">الوزن الحالي (كجم)</Label>
                <Input id="weight" name="weight" type="number" step="any" placeholder={registrationType === 'individual' ? "e.g., 450" : "متوسط وزن الواحدة"} required />
                {createState?.errors?.weight && <p className="text-xs text-red-500">{createState.errors.weight[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">العمر الحالي (أشهر)</Label>
                <Input id="age" name="age" type="number" placeholder="e.g., 18" required />
                 {createState?.errors?.age && <p className="text-xs text-red-500">{createState.errors.age[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barn">العنبر</Label>
                <input type="hidden" name="barnId" value={barnId} />
                <Select value={barnId} onValueChange={setBarnId} required>
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
            </div>
             <div className="grid gap-2">
                <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                <Textarea id="notes" name="notes" placeholder="أي ملاحظات إضافية عن الحالة الصحية أو مصدر الحيوان..."/>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild type="button">
                <Link href="/dashboard">إلغاء</Link>
              </Button>
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
