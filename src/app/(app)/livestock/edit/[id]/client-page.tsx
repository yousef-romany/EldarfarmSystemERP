
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
import { updateLivestock, LivestockState } from '@/lib/actions/livestock.actions';
import type { Barn, LivestockType, Livestock } from '@prisma/client';
import { format } from 'date-fns';

type EditLivestockClientPageProps = {
    livestock: Livestock;
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

export default function EditLivestockClientPage({ livestock, barns, livestockTypes }: EditLivestockClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const updateLivestockWithId = updateLivestock.bind(null, livestock.id);
  const [state, formAction] = useActionState(updateLivestockWithId, { message: null, errors: {}, success: false });

  const [registrationType, setRegistrationType] = useState(livestock.isBatch ? 'batch' : 'individual');

  useEffect(() => {
    if (state.success) {
      toast({ title: 'نجاح', description: state.message });
      router.push('/livestock'); 
    } else if (state.message && !state.success) {
      toast({ title: 'خطأ', description: state.message, variant: 'destructive' });
    }
  }, [state, toast, router]);

  return (
    <>
      <PageHeader title={`تعديل ماشية: ${livestock.tagId || 'دفعة'}`} />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardDescription>
            استخدم هذا النموذج لتعديل بيانات المواشي.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" action={formAction}>
            <input type="hidden" name="registrationType" value={registrationType} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="grid gap-2">
                <Label htmlFor="entryDate">تاريخ الإدخال</Label>
                <Input id="entryDate" name="entryDate" type="date" required defaultValue={format(new Date(livestock.createdAt), 'yyyy-MM-dd')} />
                {state?.errors?.entryDate && <p className="text-xs text-red-500">{state.errors.entryDate[0]}</p>}
              </div>
               <div className="grid gap-2">
                <Label htmlFor="estimatedCost">التكلفة (ج.م)</Label>
                <Input id="estimatedCost" name="cost" type="number" placeholder="e.g., 15000" required defaultValue={livestock.cost} />
                 {state?.errors?.cost && <p className="text-xs text-red-500">{state.errors.cost[0]}</p>}
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
                  <Input id="tagId" name="tagId" defaultValue={livestock.tagId || ''} placeholder="e.g., COW-004" />
                   {state?.errors?.tagId && <p className="text-xs text-red-500">{state.errors.tagId[0]}</p>}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="type">النوع</Label>
                <Select name="livestockTypeId" required defaultValue={livestock.livestockTypeId}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {livestockTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {state?.errors?.livestockTypeId && <p className="text-xs text-red-500">{state.errors.livestockTypeId[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="breed">السلالة</Label>
                <Input id="breed" name="breed" defaultValue={livestock.breed || ''} placeholder="e.g., هولشتاين, ساسو" />
                 {state?.errors?.breed && <p className="text-xs text-red-500">{state.errors.breed[0]}</p>}
              </div>
              {registrationType === 'batch' && (
                <div className="grid gap-2">
                  <Label htmlFor="quantity">الكمية</Label>
                  <Input id="quantity" name="quantity" type="number" defaultValue={livestock.quantity || undefined} placeholder="e.g., 50" required />
                   {state?.errors?.quantity && <p className="text-xs text-red-500">{state.errors.quantity[0]}</p>}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="weight">الوزن الحالي (كجم)</Label>
                <Input id="weight" name="weight" type="number" defaultValue={livestock.weight} placeholder={registrationType === 'individual' ? "e.g., 450" : "متوسط وزن الواحدة"} required />
                {state?.errors?.weight && <p className="text-xs text-red-500">{state.errors.weight[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">العمر الحالي (أشهر)</Label>
                <Input id="age" name="age" type="number" defaultValue={livestock.age} placeholder="e.g., 18" required />
                 {state?.errors?.age && <p className="text-xs text-red-500">{state.errors.age[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barn">العنبر</Label>
                <Select name="barnId" required defaultValue={livestock.barnId}>
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
                 {state?.errors?.barnId && <p className="text-xs text-red-500">{state.errors.barnId[0]}</p>}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild type="button">
                <Link href="/livestock">إلغاء</Link>
              </Button>
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
