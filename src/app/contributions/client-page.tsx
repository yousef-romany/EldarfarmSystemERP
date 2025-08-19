
'use client';
import { MoreHorizontal, Printer, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import Link from 'next/link';
import type { Contribution } from '@prisma/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteContribution } from '@/lib/actions/contribution.actions';
import { useToast } from '@/hooks/use-toast';

export default function ContributionsClientPage({ contributions }: { contributions: Contribution[] }) {
  const { toast } = useToast();
  
  const handlePrint = (contributionId: string) => {
    const url = `/contributions/receipt/${contributionId}`;
    window.open(url, '_blank');
  };

  const handleDelete = async (id: string) => {
    const result = await deleteContribution(id);
    if (result.success) {
      toast({
        title: "نجاح",
        description: result.message,
      });
    } else {
      toast({
        title: "خطأ",
        description: result.message,
        variant: "destructive",
      });
    }
  }

  return (
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
               <AlertDialog key={contribution.id}>
                  <TableRow>
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
                           <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                حذف
                              </DropdownMenuItem>
                           </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                   <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          سيتم حذف هذه المساهمة نهائيًا. سيؤثر هذا على أرصدة المحافظ. لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(contribution.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          نعم، قم بالحذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
