
'use client';
import { MoreHorizontal, PlusCircle, Printer, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { contributions } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { format } from 'date-fns';
import Link from 'next/link';

export default function ContributionsPage() {
  
  const handlePrint = (contributionId: string) => {
    const url = `/contributions/receipt/${contributionId}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <PageHeader
        title="سجل المساهمات النقدية"
        action={
          <Button asChild>
            <Link href="/contributions/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              إضافة مساهمة
            </Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>المساهمات المسجلة</CardTitle>
          <CardDescription>قائمة بجميع المساهمات النقدية والنذور المسجلة.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المانح</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead className="text-left">المبلغ</TableHead>
                <TableHead>
                  <span className="sr-only">الإجراءات</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributions.map((contribution) => (
                <TableRow key={contribution.id}>
                  <TableCell className="font-medium">{contribution.donorName}</TableCell>
                  <TableCell>{contribution.description}</TableCell>
                  <TableCell>{format(new Date(contribution.date), 'yyyy-MM-dd')}</TableCell>
                  <TableCell className="text-left">{contribution.totalAmount.toLocaleString()} ج.م</TableCell>
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
                          <Link href={`/contributions/edit/${contribution.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            تعديل
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrint(contribution.id)}>
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
    </>
  );
}
