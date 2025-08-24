
'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { createLivestockType, updateLivestockType, deleteLivestockType } from '@/lib/actions/livestock-type.actions';
import type { LivestockType } from '@prisma/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSession } from '@/components/session-provider';


function SubmitButton({ pendingText = 'جاري الحفظ...', text = 'حفظ' }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingText : text}
    </Button>
  );
}

export function LivestockTypesClient({ types }: { types: LivestockType[] }) {
  const { user } = useSession();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<LivestockType | null>(null);
  const { toast } = useToast();

  const [createState, createFormAction] = useActionState(createLivestockType, { message: null, errors: {}, success: false });

  const updateTypeWithId = selectedType ? updateLivestockType.bind(null, selectedType.id) : async () => {};
  const [updateState, updateFormAction] = useActionState(updateTypeWithId, { message: null, errors: {}, success: false });
  

  useEffect(() => {
    if (createState?.success) {
      toast({
        title: 'نجاح',
        description: createState.message,
      });
      setIsAddDialogOpen(false);
    } else if (createState?.message && !createState.success) {
      toast({
        title: 'خطأ',
        description: createState.message,
        variant: 'destructive',
      });
    }
  }, [createState, toast]);
  
  useEffect(() => {
    if (updateState?.success) {
      toast({
        title: 'نجاح',
        description: updateState.message,
      });
      setIsEditDialogOpen(false);
      setSelectedType(null);
    } else if (updateState?.message && !updateState.success) {
      toast({
        title: 'خطأ',
        description: updateState.message,
        variant: 'destructive',
      });
    }
  }, [updateState, toast]);
  
  const handleEditClick = (type: LivestockType) => {
    setSelectedType(type);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = async (id: string) => {
    const result = await deleteLivestockType(id);
     if (result?.success) {
      toast({
        title: 'نجاح',
        description: result.message,
      });
    } else if (result?.message && !result.success) {
      toast({
        title: 'خطأ',
        description: result.message,
        variant: 'destructive',
      });
    }
  };


  return (
    <>
      <PageHeader title="إدارة أنواع المواشي" />
      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>الأنواع المسجلة</CardTitle>
              {user?.permissions.livestockTypes.add && (
                <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  إضافة نوع
                </Button>
              )}
            </div>
            <CardDescription>
              إدارة الأنواع الرئيسية للمواشي في المزرعة (e.g., أبقار, أغنام).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم النوع</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map((type) => (
                   <AlertDialog key={type.id}>
                      <TableRow>
                        <TableCell className="font-medium">{type.name}</TableCell>
                        <TableCell className="text-left">
                          {user?.permissions.livestockTypes.edit && (
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(type)}>
                                  <Edit className="h-4 w-4" />
                              </Button>
                          )}
                          {user?.permissions.livestockTypes.delete && (
                             <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                             </AlertDialogTrigger>
                          )}
                        </TableCell>
                      </TableRow>
                       <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              سيتم حذف النوع "{type.name}" نهائيًا. لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteClick(type.id)}
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
      </div>

      {/* Add Type Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <form action={createFormAction}>
                <DialogHeader>
                    <DialogTitle>إضافة نوع جديد</DialogTitle>
                    <DialogDescription>
                    أدخل اسم النوع الرئيسي الجديد للمواشي.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type-name" className="text-right">
                        اسم النوع
                    </Label>
                    <Input id="type-name" name="name" placeholder="e.g., جمال" className="col-span-3" />
                    </div>
                     {createState?.errors?.name && <p className="col-span-4 text-xs text-red-500">{createState.errors.name[0]}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                    <Button type="button" variant="secondary">
                        إلغاء
                    </Button>
                    </DialogClose>
                    <SubmitButton />
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Type Dialog */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <form action={updateFormAction}>
                <DialogHeader>
                    <DialogTitle>تعديل نوع: {selectedType?.name}</DialogTitle>
                    <DialogDescription>
                        قم بتحديث اسم النوع.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-type-name" className="text-right">
                            اسم النوع
                        </Label>
                        <Input id="edit-type-name" name="name" defaultValue={selectedType?.name} className="col-span-3" />
                    </div>
                    {updateState?.errors?.name && <p className="col-span-4 text-xs text-red-500">{updateState.errors.name[0]}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">إلغاء</Button>
                    </DialogClose>
                    <SubmitButton text="حفظ التعديلات" />
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
