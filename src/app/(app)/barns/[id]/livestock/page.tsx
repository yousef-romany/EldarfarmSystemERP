
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Livestock, LivestockType } from '@prisma/client';

type LivestockWithDetails = Livestock & {
  livestockType: LivestockType;
};

export default async function BarnLivestockPage({ params }: { params: { id: string } }) {
  const barnId = params.id;

  const barn = await prisma.barn.findUnique({
    where: { id: barnId },
    include: {
      livestock: {
        include: {
          livestockType: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!barn) {
    notFound();
  }
  
  const getStatusVariant = (status: Livestock['status']) => {
    switch (status) {
      case 'Available': return 'default';
      case 'Sold': return 'destructive';
      case 'Vowed': return 'secondary';
      case 'PendingSale': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusText = (status: Livestock['status']) => {
    switch (status) {
      case 'Available': return 'متاح';
      case 'Sold': return 'مباع';
      case 'Vowed': return 'نذر';
      case 'PendingSale': return 'بيع آجل';
      default: return status;
    }
  };
  
  const getTypeText = (animal: LivestockWithDetails) => {
    if (animal.isBatch) {
      return `دفعة ${animal.livestockType.name}`;
    }
    return animal.livestockType.name;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title={`محتويات العنبر: ${barn.name}`} className="mb-0" />
         <Button asChild variant="outline">
          <Link href="/barns">الرجوع إلى العنابر</Link>
        </Button>
      </div>

       <Card className="mb-6">
        <CardHeader>
          <CardTitle>ملخص العنبر</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
                 <p className="text-sm text-muted-foreground mb-2">
                      الإشغال: {barn.currentOccupancy} / {barn.capacity} رأس
                </p>
                <Progress value={(barn.currentOccupancy / barn.capacity) * 100} className="h-3" />
            </div>
             <div>
                <p className="text-sm text-muted-foreground">
                  مساحة فارغة لـ {barn.capacity - barn.currentOccupancy} رأس
                </p>
              </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الحيوانات في العنبر</CardTitle>
          <CardDescription>
            جميع الحيوانات المسجلة حاليًا في عنبر "{barn.name}".
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
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {barn.livestock.length > 0 ? (
                barn.livestock.map((animal) => (
                  <TableRow key={animal.id}>
                    <TableCell className="font-medium">
                      {animal.isBatch ? `${animal.quantity} رأس` : animal.tagId}
                    </TableCell>
                    <TableCell>{getTypeText(animal as LivestockWithDetails)}</TableCell>
                    <TableCell>{animal.breed}</TableCell>
                    <TableCell>{animal.weight.toNumber()} {animal.isBatch && <span className="text-xs text-muted-foreground">(متوسط)</span>}</TableCell>
                    <TableCell>{animal.age}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(animal.status)}>{getStatusText(animal.status)}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    لا توجد حيوانات في هذا العنبر حاليًا.
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
