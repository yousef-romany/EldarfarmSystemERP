
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/prisma';
import type { Livestock, LivestockType, Barn } from '@prisma/client';

type LivestockWithDetails = Livestock & {
  barn: Barn;
  livestockType: LivestockType;
};

export default async function AvailableLivestockReportPage() {
  
  const availableLivestock = await prisma.livestock.findMany({
    where: { status: 'Available' },
    include: {
      barn: true,
      livestockType: true,
    },
    orderBy: { tagId: 'asc' }
  });

  const getTypeText = (animal: LivestockWithDetails) => {
    if (animal.isBatch) {
      return `دفعة ${animal.livestockType.name}`;
    }
    return animal.livestockType.name;
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
                    <TableCell>{animal.weight.toNumber()} {animal.isBatch && <span className="text-xs text-muted-foreground">(متوسط)</span>}</TableCell>
                    <TableCell>{animal.age}</TableCell>
                    <TableCell>{animal.barn.name}</TableCell>
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
