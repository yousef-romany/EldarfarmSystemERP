
'use client';
import { MoreHorizontal, Printer, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import Link from 'next/link';
import type { Vow, Livestock, LivestockType } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type VowWithDetails = Vow & {
    livestock: Livestock & {
        livestockType: LivestockType
    }
};

export default function VowsClientPage({ vows }: { vows: VowWithDetails[] }) {

  const getLivestockDetails = (livestock: VowWithDetails['livestock']) => {
    if (!livestock) return 'غير معروف';
    if (livestock.isBatch) {
      return `دفعة ${livestock.livestockType.name} (${livestock.quantity} رأس)`;
    }
    return `${livestock.tagId || 'بدون رقم'} (${livestock.livestockType.name})`;
  }
  
  const handlePrint = (vowId: string) => {
    const url = `/vows/receipt/${vowId}`;
    window.open(url, '_blank');
  };

  return (
      <Card>
        <CardHeader>
            <CardTitle>النذور المسجلة</CardTitle>
            <CardDescription>قائمة بجميع الحيوانات والدفعات التي تم استلامها كنذور.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الناذر</TableHead>
                <TableHead>رقم الإيصال</TableHead>
                <TableHead>تاريخ الاستلام</TableHead>
                <TableHead>الحيوان/الدفعة</TableHead>
                <TableHead>
                  <span className="sr-only">الإجراءات</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vows.map((vow) => (
                <TableRow key={vow.id}>
                  <TableCell className="font-medium">{vow.donorName}</TableCell>
                  <TableCell>{vow.receiptId || 'N/A'}</TableCell>
                  <TableCell>{format(new Date(vow.date), 'yyyy-MM-dd')}</TableCell>
                  <TableCell>{getLivestockDetails(vow.livestock)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">فتح القائمة</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/vows/edit/${vow.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                تعديل
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrint(vow.id)}>
                            <Printer className="mr-2 h-4 w-4" />
                            طباعة الإيصال
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  );
}
