
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatDateArabic } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import type { Sale, Livestock, LivestockType, Barn } from '@prisma/client';

type PendingSaleWithDetails = Sale & {
  livestock: Livestock & {
    livestockType: LivestockType;
    barn: Barn;
  };
};

export default async function DeferredSalesReportPage() {
  
  // Fetch pending sales and their associated livestock
  const pendingSales: PendingSaleWithDetails[] = await prisma.sale.findMany({
    where: { status: 'Pending' },
    include: {
      livestock: {
        include: {
          livestockType: true,
          barn: true,
        },
      },
    },
    orderBy: { saleDate: 'asc' },
  });


  return (
    <>
      <PageHeader title="تقرير المبيعات الآجلة المعلقة" />
      <Card>
        <CardHeader>
          <CardTitle>قائمة الحيوانات المحجوزة للبيع</CardTitle>
          <CardDescription>
            هذا التقرير يعرض جميع الحيوانات المرتبطة بعمليات بيع آجلة لم تتم تسويتها بعد.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرقم التعريفي</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>العنبر</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>تاريخ الحجز</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSales.length > 0 ? (
                pendingSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.livestock.tagId}</TableCell>
                    <TableCell>{sale.livestock.livestockType.name}</TableCell>
                    <TableCell>{sale.livestock.barn.name}</TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>{formatDateArabic(sale.saleDate)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    لا توجد عمليات بيع آجل معلقة حاليًا.
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
