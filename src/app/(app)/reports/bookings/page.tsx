

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
  
  // Fetch all livestock that are either booked for a pending sale or are a vow.
  const bookedAnimalsData = await prisma.livestock.findMany({
    where: {
      status: {
        in: ['PendingSale', 'Vowed']
      }
    },
    include: {
      livestockType: true,
      barn: true,
      sales: { // Get the associated sale if it exists
        where: { status: 'Pending' }
      },
      vows: true, // Get the associated vow if it exists
    },
    orderBy: { createdAt: 'asc' }
  });

  const bookedLivestock: BookedAnimal[] = bookedAnimalsData.map(animal => {
    if (animal.status === 'PendingSale' && animal.sales.length > 0) {
      const sale = animal.sales[0];
      return {
        id: animal.id,
        tagId: animal.tagId,
        type: animal.livestockType.name,
        barnName: animal.barn.name,
        bookingInfo: {
          type: 'بيع آجل' as const,
          customer: sale.customerName,
          date: format(new Date(sale.saleDate), 'yyyy-MM-dd'),
        },
      };
    } else if (animal.status === 'Vowed' && animal.vows.length > 0) {
        const vow = animal.vows[0];
         return {
            id: animal.id,
            tagId: animal.tagId,
            type: animal.livestockType.name,
            barnName: animal.barn.name,
            bookingInfo: {
                type: 'نذر حى' as const,
                customer: vow.donorName,
                date: format(new Date(vow.date), 'yyyy-MM-dd'),
            },
        };
    }
    // This should ideally not be reached if the query is correct
    return {
        id: animal.id,
        tagId: animal.tagId,
        type: animal.livestockType.name,
        barnName: animal.barn.name,
        bookingInfo: {
            type: animal.status === 'PendingSale' ? 'بيع آجل' : 'نذر حى',
            customer: 'غير معروف',
            date: format(new Date(animal.createdAt), 'yyyy-MM-dd'),
        },
    }
  }).sort((a,b) => new Date(a.bookingInfo.date).getTime() - new Date(b.bookingInfo.date).getTime());

  return (
    <>
      <PageHeader title="تقرير الحجوزات والنذور الحية" />
      <Card>
        <CardHeader>
          <CardTitle>قائمة الحيوانات المحجوزة</CardTitle>
          <CardDescription>
            هذا التقرير يعرض جميع الحيوانات المرتبطة بعمليات بيع آجلة (لم تتم تسويتها) أو التي تم استلامها كنذور حية.
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

