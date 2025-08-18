
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { livestock, barns } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import type { Livestock } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export default function AvailableLivestockReportPage() {
  
  const availableLivestock = livestock.filter(animal => animal.status === 'Available');

  const getBarnName = (barnId: string) => {
    return barns.find((b) => b.id === barnId)?.name || 'غير محدد';
  };
  
  const getTypeText = (animal: Livestock) => {
    if (animal.isBatch) {
       switch (animal.type) {
         case 'Chicken': return 'دفعة دجاج';
         case 'Sheep': return 'دفعة غنم';
         case 'Goat': return 'دفعة ماعز';
         default: return `دفعة ${animal.type}`;
       }
    }
    switch (animal.type) {
      case 'Cow': return 'بقرة';
      case 'Sheep': return 'خروف';
      case 'Goat': return 'ماعز';
      case 'Chicken': return 'دجاج';
      default: return animal.type;
    }
  }

  return (
    <>
      <PageHeader title="تقرير المواشي المتاحة" />
      <Card>
        <CardHeader>
          <CardTitle>قائمة المواشي المتاحة</CardTitle>
          <CardDescription>
            هذا التقرير يعرض جميع الحيوانات والدفعات المتاحة حاليًا في المزرعة وغير مرتبطة بأي عمليات بيع أو نذور.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرقم التعريفي / الكمية</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>السلالة</TableHead>
                <TableHead>الوزن (كجم)</TableHead>
                <TableHead>العمر (أشهر)</TableHead>
                <TableHead>العنبر</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableLivestock.length > 0 ? (
                availableLivestock.map((animal) => (
                  <TableRow key={animal.id}>
                    <TableCell className="font-medium">
                      {animal.isBatch ? `${animal.quantity} رأس` : animal.tagId}
                    </TableCell>
                    <TableCell>{getTypeText(animal)}</TableCell>
                    <TableCell>{animal.breed}</TableCell>
                    <TableCell>{animal.weight} {animal.isBatch && <span className="text-xs text-muted-foreground">(متوسط)</span>}</TableCell>
                    <TableCell>{animal.age}</TableCell>
                    <TableCell>{getBarnName(animal.barnId)}</TableCell>
                    <TableCell>
                      <Badge variant={'default'}>متاح</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    لا توجد مواشٍ متاحة حاليًا.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
