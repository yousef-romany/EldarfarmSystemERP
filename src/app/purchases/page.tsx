import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { barns } from '@/lib/data';
import { PageHeader } from '@/components/page-header';

export default function PurchasesPage() {
  return (
    <>
      <PageHeader title="إضافة عملية شراء جديدة" />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>تفاصيل الحيوان الجديد</CardTitle>
          <CardDescription>املأ النموذج أدناه لتسجيل حيوان جديد في النظام.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tagId">الرقم التعريفي</Label>
                <Input id="tagId" placeholder="e.g., COW-004" />
              </div>
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
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="breed">السلالة</Label>
                <Input id="breed" placeholder="e.g., هولشتاين" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weight">الوزن عند الشراء (كجم)</Label>
                <Input id="weight" type="number" placeholder="e.g., 450" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">العمر عند الشراء (أشهر)</Label>
                <Input id="age" type="number" placeholder="e.g., 18" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchase-price">سعر الشراء (ج.م)</Label>
                <Input id="purchase-price" type="number" placeholder="e.g., 50000" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barn">العنبر</Label>
                <Select>
                  <SelectTrigger id="barn">
                    <SelectValue placeholder="اختر العنبر" />
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
                <Label htmlFor="purchase-date">تاريخ الشراء</Label>
                <Input id="purchase-date" type="date" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">إلغاء</Button>
              <Button>حفظ و إضافة</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
