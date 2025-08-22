
'use client';

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { PlusCircle, Warehouse, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createBarn, updateBarn, deleteBarn } from '@/lib/actions/barn.actions';
import type { Barn } from '@prisma/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';


function SubmitButton({ pendingText = 'جاري الحفظ...', text = 'حفظ' }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingText : text}
    </Button>
  );
}

export function BarnsClient({ barns }: { barns: Barn[] }) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBarn, setSelectedBarn] = useState<Barn | null>(null);
  const { toast } = useToast();

  // Form state for creating a barn
  const [createState, createFormAction] = useActionState(createBarn, { message: null, errors: {}, success: false });

  // Form state for updating a barn
  // We need to bind the barn ID to the update action
  const updateBarnWithId = selectedBarn ? updateBarn.bind(null, selectedBarn.id) : async () => {};
  const [updateState, updateFormAction] = useActionState(updateBarnWithId, { message: null, errors: {}, success: false });
  

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
      setSelectedBarn(null);
    } else if (updateState?.message && !updateState.success) {
      toast({
        title: 'خطأ',
        description: updateState.message,
        variant: 'destructive',
      });
    }
  }, [updateState, toast]);
  
  const handleEditClick = (barn: Barn) => {
    setSelectedBarn(barn);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = async (id: string) => {
    const result = await deleteBarn(id);
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
      <PageHeader
        title="إدارة العنابر"
        action={
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            إضافة عنبر
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {barns.map((barn) => (
          <AlertDialog key={barn.id}>
            <Card>
              <CardHeader>
                  <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                          <Warehouse className="h-8 w-8 text-muted-foreground" />
                          <div>
                              <CardTitle>{barn.name}</CardTitle>
                              <CardDescription>
                                  السعة: {barn.capacity} رأس
                              </CardDescription>
                          </div>
                      </div>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">فتح القائمة</span>
                          </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditClick(barn)}>تعديل</DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/barns/${barn.id}/livestock`}>عرض الحيوانات</Link>
                          </DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                  حذف
                              </DropdownMenuItem>
                          </AlertDialogTrigger>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
              </CardHeader>
              <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">
                      الإشغال: {barn.currentOccupancy} / {barn.capacity}
                  </div>
                <Progress value={(barn.currentOccupancy / barn.capacity) * 100} className="h-3" />
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  مساحة فارغة لـ {barn.capacity - barn.currentOccupancy} رأس
                </p>
              </CardFooter>
              <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف العنبر "{barn.name}" نهائيًا. لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteClick(barn.id)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      نعم، قم بالحذف
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
            </Card>
          </AlertDialog>
        ))}
      </div>

       {/* Add Barn Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <form action={createFormAction}>
                <DialogHeader>
                    <DialogTitle>إضافة عنبر جديد</DialogTitle>
                    <DialogDescription>
                    املأ البيانات التالية لإنشاء عنبر جديد في المزرعة.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="barn-name" className="text-right">
                            اسم العنبر
                        </Label>
                        <Input id="barn-name" name="name" placeholder="e.g., عنبر التسمين الغربي" className="col-span-3" />
                    </div>
                    {createState?.errors?.name && <p className="col-span-4 text-xs text-red-500">{createState.errors.name[0]}</p>}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="barn-capacity" className="text-right">
                            السعة (رأس)
                        </Label>
                        <Input id="barn-capacity" name="capacity" type="number" placeholder="e.g., 100" className="col-span-3" />
                    </div>
                     {createState?.errors?.capacity && <p className="col-span-4 text-xs text-red-500">{createState.errors.capacity[0]}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">إلغاء</Button>
                    </DialogClose>
                    <SubmitButton />
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Barn Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
             <form action={updateFormAction}>
                <DialogHeader>
                    <DialogTitle>تعديل العنبر: {selectedBarn?.name}</DialogTitle>
                    <DialogDescription>
                        قم بتحديث بيانات العنبر أدناه.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-barn-name" className="text-right">
                            اسم العنبر
                        </Label>
                        <Input id="edit-barn-name" name="name" defaultValue={selectedBarn?.name} className="col-span-3" />
                    </div>
                    {updateState?.errors?.name && <p className="col-span-4 text-xs text-red-500">{updateState.errors.name[0]}</p>}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-barn-capacity" className="text-right">
                            السعة (رأس)
                        </Label>
                        <Input id="edit-barn-capacity" name="capacity" type="number" defaultValue={selectedBarn?.capacity} className="col-span-3" />
                    </div>
                    {updateState?.errors?.capacity && <p className="col-span-4 text-xs text-red-500">{updateState.errors.capacity[0]}</p>}
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
