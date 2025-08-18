
'use client';
import { MoreHorizontal, PlusCircle, Printer, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { vows, livestock } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';


export default function VowsListPage() {
  const router = useRouter();

  const getLivestockDetails = (livestockId: string) => {
    const animal = livestock.find((l) => l.id === livestockId);
    if (!animal) return 'غير معروف';
    if (animal.isBatch) {
      return `دفعة ${animal.type === 'Chicken' ? 'دجاج' : animal.type === 'Sheep' ? 'غنم' : 'ماعز'} (${animal.quantity} رأس)`;
    }
    return `${animal.tagId} (${animal.type === 'Cow' ? 'بقرة' : 'خروف'})`;
  }
  
  const handlePrint = (vowId: string) => {
    const url = `/vows/receipt/${vowId}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <PageHeader
        title="سجل النذور"
        action={
          <Button asChild>
            <Link href="/vows/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                إضافة نذر جديد
            </Link>
          </Button>
        }
      />
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
                  <TableCell>{vow.receiptId}</TableCell>
                  <TableCell>{format(new Date(vow.date), 'yyyy-MM-dd')}</TableCell>
                  <TableCell>{getLivestockDetails(vow.livestockId)}</TableCell>
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
                                <Pencil className="ml-2 h-4 w-4" />
                                تعديل
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrint(vow.id)}>
                            <Printer className="ml-2 h-4 w-4" />
                            طباعة الإيصال
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                            <Trash2 className="ml-2 h-4 w-4" />
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
    </>
  );
}
