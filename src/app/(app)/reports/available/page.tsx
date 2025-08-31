

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
  
  const availableLivestockData = await prisma.livestock.findMany({
    where: { 
      status: {
        in: ['Available', 'Vowed']
      } 
    },
    include: {
      barn: true,
      livestockType: true,
    },
    orderBy: { tagId: 'asc' }
  });

  const availableLivestock = availableLivestockData.map(animal => ({
    ...animal,
    weight: animal.weight,
  }));

  const getTypeText = (animal: LivestockWithDetails) => {
    if (animal.isBatch) {
      return `دفعة ${animal.livestockType.name}`;
    }
    return animal.livestockType.name;
  }

  const getStatusVariant = (status: Livestock['status']) => {
    switch (status) {
      case 'Available': return 'default';
      case 'Vowed': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusText = (status: Livestock['status']) => {
    switch (status) {
      case 'Available': return 'متاح';
      case 'Vowed': return 'نذر';
      default: return status;
    }
  };

  return (
    <>
      <PageHeader title="تقرير المواشي المتاحة والنذور الحية" />
      <Card>
        <CardHeader>
          <CardTitle>قائمة المواشي المتاحة والنذور</CardTitle>
          <CardDescription>
            هذا التقرير يعرض جميع الحيوانات والدفعات المتاحة للبيع، بما في ذلك النذور الحية.
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
                    <TableCell>{getTypeText(animal as any)}</TableCell>
                    <TableCell>{animal.breed}</TableCell>
                    <TableCell>{animal.weight} {animal.isBatch && <span className="text-xs text-muted-foreground">(متوسط)</span>}</TableCell>
                    <TableCell>{animal.age}</TableCell>
                    <TableCell>{animal.barn.name}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(animal.status)}>{getStatusText(animal.status)}</Badge>
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
