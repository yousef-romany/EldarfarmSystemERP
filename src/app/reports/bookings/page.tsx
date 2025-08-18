
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { livestock, barns, sales, vows } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function BookedLivestockReportPage() {
  
  const pendingSaleAnimals = sales
    .filter(s => s.status === 'Pending')
    .map(s => {
        const animal = livestock.find(l => l.id === s.animalId);
        return animal ? { ...animal, bookingInfo: { type: 'بيع آجل', customer: s.customerName, date: s.saleDate } } : null;
    })
    .filter(Boolean);
    
  const vowedAnimals = livestock
    .filter(animal => animal.status === 'Vowed')
    .map(animal => {
        const vow = vows.find(v => v.livestockId === animal.id);
        return { ...animal, bookingInfo: { type: 'نذر', customer: vow?.donorName || 'غير محدد', date: vow?.date || '' } };
    });

  const bookedLivestock = [...pendingSaleAnimals, ...vowedAnimals];

  const getBarnName = (barnId: string) => {
    return barns.find((b) => b.id === barnId)?.name || 'غير محدد';
  };

  return (
    <>
      <PageHeader title="تقرير حجوزات الحيوانات" />
      <Card>
        <CardHeader>
          <CardTitle>قائمة الحيوانات المحجوزة</CardTitle>
          <CardDescription>
            هذا التقرير يعرض جميع الحيوانات المرتبطة بعمليات بيع آجلة لم تتم تسويتها بعد أو النذور المسجلة.
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
                  <TableRow key={animal!.id}>
                    <TableCell className="font-medium">{animal!.tagId}</TableCell>
                    <TableCell>{animal!.type}</TableCell>
                    <TableCell>{getBarnName(animal!.barnId)}</TableCell>
                    <TableCell>
                        <Badge variant={animal!.bookingInfo.type === 'نذر' ? 'secondary' : 'outline'}>
                            {animal!.bookingInfo.type}
                        </Badge>
                    </TableCell>
                    <TableCell>{animal!.bookingInfo.customer}</TableCell>
                    <TableCell>{animal!.bookingInfo.date ? format(new Date(animal!.bookingInfo.date), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    لا توجد حيوانات محجوزة حاليًا.
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
