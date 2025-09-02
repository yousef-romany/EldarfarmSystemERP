
'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Livestock, LivestockType, Barn } from '@prisma/client';
import { useSession } from '@/components/session-provider';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteLivestock } from '@/lib/actions/livestock.actions';


type LivestockWithDetails = Omit<Livestock, 'weight' | 'cost'> & {
    weight: number;
    cost: number;
    livestockType: LivestockType;
    barn: Barn;
};


type LivestockClientPageProps = {
    initialLivestock: LivestockWithDetails[];
}

export default function LivestockClientPage({ initialLivestock }: LivestockClientPageProps) {
  const { user } = useSession();
  const { toast } = useToast();
  const [livestockList, setLivestockList] = useState(initialLivestock);

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
  
  const handleDelete = async (id: string) => {
      const result = await deleteLivestock(id);
      if (result.success) {
          toast({ title: 'نجاح', description: result.message });
          setLivestockList(prev => prev.filter(l => l.id !== id));
      } else {
          toast({ title: 'خطأ', description: result.message, variant: 'destructive' });
      }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>قائمة جميع المواشي الحية</CardTitle>
        <CardDescription>
          عرض وتعديل جميع المواشي المسجلة في النظام والتي لم يتم بيعها بعد.
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
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {livestockList.length > 0 ? (
              livestockList.map((animal) => (
                <AlertDialog key={animal.id}>
                    <TableRow>
                        <TableCell className="font-medium">
                        {animal.isBatch ? `${animal.quantity} رأس` : animal.tagId}
                        </TableCell>
                        <TableCell>{getTypeText(animal)}</TableCell>
                        <TableCell>{animal.breed}</TableCell>
                        <TableCell>{animal.weight} {animal.isBatch && <span className="text-xs text-muted-foreground">(متوسط)</span>}</TableCell>
                        <TableCell>{animal.age}</TableCell>
                        <TableCell>{animal.barn.name}</TableCell>
                        <TableCell>
                        <Badge variant={getStatusVariant(animal.status)}>{getStatusText(animal.status)}</Badge>
                        </TableCell>
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
                                {user?.permissions.livestock.edit && (
                                    <DropdownMenuItem asChild>
                                        <Link href={`/livestock/edit/${animal.id}`}>
                                            <Pencil className="mr-2 h-4 w-4" /> تعديل
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف سجل هذا الحيوان نهائيًا. لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleDelete(animal.id)}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            نعم، قم بالحذف
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  لا توجد مواشٍ مسجلة حاليًا.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
