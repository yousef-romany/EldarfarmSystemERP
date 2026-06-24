'use client';
import { useEffect, useState, useActionState } from 'react';
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
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { updateVow } from '@/lib/actions/vow.actions';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type VowWithDetails = Omit<Vow, 'livestock'> & {
    livestock: Omit<Livestock, 'weight'| 'cost'> & {
        weight: number;
        cost: number;
        livestockType: LivestockType;
        barn: Barn;
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

export default function EditVowPageClient({ vow, barns, livestockTypes }: EditVowPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const updateVowWithId = updateVow.bind(null, vow.id);
  const [updateState, updateFormAction] = useActionState(updateVowWithId, { message: null, errors: {}, success: false });

  const [registrationType, setRegistrationType] = useState(vow.livestock.isBatch ? 'batch' : 'individual');
  const [livestockTypeId, setLivestockTypeId] = useState(vow.livestock.livestockTypeId);
  const [barnId, setBarnId] = useState(vow.livestock.barnId);

  useEffect(() => {
    if (updateState.success) {
      toast({ title: 'نجاح', description: updateState.message });
      router.push('/vows');
    }
  }, [updateState, toast, router]);
  
  if (!vow) {
      return <div>جاري تحميل بيانات النذر...</div>
  }

  return (
    <>
      <div className='flex items-center gap-4 mb-6'>
          <Button variant="outline" size="icon" asChild>
            <Link href="/vows">
                <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader title={`تعديل النذر - ${vow.receiptId || vow.id.substring(0,8)}`} className='mb-0' />
      </div>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>تفاصيل النذر</CardTitle>
          <CardDescription>قم بتحديث بيانات النذر أدناه.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" action={updateFormAction}>
            <input type="hidden" name="registrationType" value={registrationType} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="grid gap-2">
                  <Label htmlFor="donor-name">اسم الناذر</Label>
                  <Input name="donorName" id="donor-name" defaultValue={vow.donorName} placeholder="e.g., يوسف نادر" required />
                   {updateState?.errors?.donorName && <p className="text-xs text-red-500">{updateState.errors.donorName[0]}</p>}
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
                   {updateState?.errors?.tagId && <p className="text-xs text-red-500">{updateState.errors.tagId[0]}</p>}
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
                     {livestockTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {updateState?.errors?.livestockTypeId && <p className="text-xs text-red-500">{updateState.errors.livestockTypeId[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="breed">السلالة</Label>
                <Input name="breed" id="breed" defaultValue={vow.livestock.breed || ''} placeholder="e.g., هولشتاين, ساسو"/>
                 {updateState?.errors?.breed && <p className="text-xs text-red-500">{updateState.errors.breed[0]}</p>}
              </div>
              {registrationType === 'batch' && (
                 <div className="grid gap-2">
                    <Label htmlFor="quantity">الكمية</Label>
                    <Input name="quantity" id="quantity" type="number" defaultValue={vow.livestock.quantity || ''} placeholder="e.g., 500" required/>
                     {updateState?.errors?.quantity && <p className="text-xs text-red-500">{updateState.errors.quantity[0]}</p>}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="weight">الوزن عند الاستلام (كجم)</Label>
                <Input name="weight" id="weight" type="number" step="any" defaultValue={vow.livestock.weight} placeholder={registrationType === 'individual' ? "e.g., 450" : "متوسط وزن الواحدة"} required/>
                 {updateState?.errors?.weight && <p className="text-xs text-red-500">{updateState.errors.weight[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">العمر عند الاستلام (أشهر)</Label>
                <Input name="age" id="age" type="number" defaultValue={vow.livestock.age} placeholder="e.g., 18" required />
                 {updateState?.errors?.age && <p className="text-xs text-red-500">{updateState.errors.age[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barn">العنبر</Label>
                <input type="hidden" name="barnId" value={barnId} />
                <Select value={barnId} onValueChange={setBarnId} required>
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
                 {updateState?.errors?.barnId && <p className="text-xs text-red-500">{updateState.errors.barnId[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vow-date">تاريخ الاستلام</Label>
                <Input name="date" id="vow-date" type="date" defaultValue={format(new Date(vow.date), 'yyyy-MM-dd')} required/>
                 {updateState?.errors?.date && <p className="text-xs text-red-500">{updateState.errors.date[0]}</p>}
              </div>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea name="notes" id="notes" defaultValue={vow.notes || ''} placeholder="أي ملاحظات إضافية عن الحالة الصحية أو غيرها..."/>
            </div>

            {updateState.message && !updateState.success && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>خطأ في التحديث</AlertTitle>
                    <AlertDescription>
                        {updateState.message}
                    </AlertDescription>
                </Alert>
            )}

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
