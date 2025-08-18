
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { barns } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

export default function VowsPage() {
  const [registrationType, setRegistrationType] = useState('individual');

  return (
    <>
      <PageHeader title="تسجيل نذر جديد" />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>تفاصيل النذر</CardTitle>
          <CardDescription>املأ النموذج أدناه لتسجيل حيوان أو دفعة واردة كنذر للدير.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="grid gap-2">
                  <Label htmlFor="donor-name">اسم الناذر</Label>
                  <Input id="donor-name" placeholder="e.g., يوسف نادر" />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="receipt-id">رقم الإيصال</Label>
                  <Input id="receipt-id" placeholder="e.g., 2024-00123" />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>نوع التسجيل</Label>
                <RadioGroup defaultValue="individual" onValueChange={setRegistrationType} className="flex gap-4">
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
                  <Input id="tagId" placeholder="e.g., COW-004" />
                </div>
              )}
               <div className="grid gap-2">
                <Label htmlFor="type">النوع</Label>
                <Select>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cow">بقرة</SelectItem>
                    <SelectItem value="sheep">خروف</SelectItem>
                    <SelectItem value="goat">ماعز</SelectItem>
                    <SelectItem value="chicken">دجاج</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="breed">السلالة</Label>
                <Input id="breed" placeholder="e.g., هولشتاين, ساسو" />
              </div>
              {registrationType === 'batch' && (
                 <div className="grid gap-2">
                    <Label htmlFor="quantity">الكمية</Label>
                    <Input id="quantity" type="number" placeholder="e.g., 500" />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="weight">الوزن عند الاستلام (كجم)</Label>
                <Input id="weight" type="number" placeholder={registrationType === 'individual' ? "e.g., 450" : "متوسط وزن الواحدة"} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">العمر عند الاستلام (أشهر)</Label>
                <Input id="age" type="number" placeholder="e.g., 18" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barn">العنبر</Label>
                <Select>
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
                <Input id="vow-date" type="date" />
              </div>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea id="notes" placeholder="أي ملاحظات إضافية عن الحالة الصحية أو غيرها..."/>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">إلغاء</Button>
              <Button>حفظ و تسجيل</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
