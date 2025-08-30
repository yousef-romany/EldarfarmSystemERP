

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import type { Livestock, LivestockType, Barn, Sale, Vow } from '@prisma/client';

type BookedAnimal = {
  id: string;
  tagId: string | null;
  type: string;
  barnName: string;
  bookingInfo: {
    type: 'بيع آجل' | 'نذر حى';
    customer: string; // Can be customer or donor
    date: string;
  };
};

export default async function BookedLivestockReportPage() {
  
  const pendingSales = await prisma.sale.findMany({
    where: { status: 'Pending' },
    include: {
      livestock: {
        include: {
          livestockType: true,
          barn: true,
        },
      },
    },
    orderBy: { saleDate: 'asc' }
  });

  const vows = await prisma.vow.findMany({
    where: {
        livestock: {
            status: 'Vowed'
        }
    },
    include: {
        livestock: {
            include: {
                livestockType: true,
                barn: true,
            }
        }
    },
    orderBy: { date: 'asc' }
  });


  const bookedLivestock: BookedAnimal[] = [
    ...pendingSales.map(s => ({
      id: s.livestock.id,
      tagId: s.livestock.tagId,
      type: s.livestock.livestockType.name,
      barnName: s.livestock.barn.name,
      bookingInfo: {
        type: 'بيع آجل' as const,
        customer: s.customerName,
        date: format(new Date(s.saleDate), 'yyyy-MM-dd'),
      },
    })),
     ...vows.map(v => ({
      id: v.livestock.id,
      tagId: v.livestock.tagId,
      type: v.livestock.livestockType.name,
      barnName: v.livestock.barn.name,
      bookingInfo: {
        type: 'نذر حى' as const,
        customer: v.donorName,
        date: format(new Date(v.date), 'yyyy-MM-dd'),
      },
    }))
  ].sort((a,b) => new Date(a.bookingInfo.date).getTime() - new Date(b.bookingInfo.date).getTime());

  return (
    <>
      <PageHeader title="تقرير الحجوزات والنذور الحية" />
      <Card>
        <CardHeader>
          <CardTitle>قائمة الحيوانات المحجوزة</CardTitle>
          <CardDescription>
            هذا التقرير يعرض جميع الحيوانات المرتبطة بعمليات بيع آجلة أو التي تم استلامها كنذور حية.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرقم التعريفي</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>العنبر</TableHead>
                <TableHead>نوع الحجز</TableHead>
                <TableHead>العميل / الناذر</TableHead>
                <TableHead>تاريخ الحجز</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookedLivestock.length > 0 ? (
                bookedLivestock.map((animal) => (
                  <TableRow key={animal.id}>
                    <TableCell className="font-medium">{animal.tagId}</TableCell>
                    <TableCell>{animal.type}</TableCell>
                    <TableCell>{animal.barnName}</TableCell>
                    <TableCell>
                        <Badge variant={animal.bookingInfo.type === 'بيع آجل' ? 'secondary' : 'outline'}>
                            {animal.bookingInfo.type}
                        </Badge>
                    </TableCell>
                    <TableCell>{animal.bookingInfo.customer}</TableCell>
                    <TableCell>{animal.bookingInfo.date}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    لا توجد عمليات بيع آجل أو نذور حية معلقة حاليًا.
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
