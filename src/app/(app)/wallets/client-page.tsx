
'use client';

import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { PlusCircle, Wallet as WalletIcon, MoreHorizontal, Trash2, Pencil, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createWallet, updateWallet, deleteWallet } from '@/lib/actions/wallet.actions';
import type { Wallet } from '@prisma/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


function SubmitButton({ pendingText = 'جاري الحفظ...', text = 'حفظ' }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingText : text}
    </Button>
  );
}

export default function WalletsClientPage({ wallets }: { wallets: Wallet[] }) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const { toast } = useToast();

  const [createState, createFormAction] = useFormState(createWallet, { message: null, errors: {}, success: false });

  const updateWalletWithId = selectedWallet ? updateWallet.bind(null, selectedWallet.id) : async () => {};
  const [updateState, updateFormAction] = useFormState(updateWalletWithId, { message: null, errors: {}, success: false });
  

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
      setSelectedWallet(null);
    } else if (updateState?.message && !updateState.success) {
      toast({
        title: 'خطأ',
        description: updateState.message,
        variant: 'destructive',
      });
    }
  }, [updateState, toast]);
  
  const handleEditClick = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = async (id: string) => {
    const result = await deleteWallet(id);
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
        title="إدارة المحافظ والخزائن"
        action={
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            إضافة محفظة
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {wallets.map((wallet) => (
           <AlertDialog key={wallet.id}>
              <Card>
                  <CardHeader>
                      <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-3'>
                              { wallet.icon === 'cash' ? <Banknote className="h-10 w-10 text-muted-foreground" /> : <WalletIcon className="h-10 w-10 text-muted-foreground" /> }
                              <CardTitle>{wallet.name}</CardTitle>
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
                              <DropdownMenuItem onClick={() => handleEditClick(wallet)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem>عرض الحركات</DropdownMenuItem>
                              <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      حذف
                                  </DropdownMenuItem>
                              </AlertDialogTrigger>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                  </CardHeader>
                  <CardContent>
                      <p className='text-2xl font-bold tracking-tight'>
                          {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(wallet.balance.toNumber())}
                      </p>
                      <p className='text-sm text-muted-foreground'>الرصيد الحالي</p>
                  </CardContent>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                      <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                      <AlertDialogDescription>
                          سيتم حذف المحفظة "{wallet.name}" نهائيًا. لا يمكن حذف المحافظ التي تحتوي على معاملات.
                      </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction
                          onClick={() => handleDeleteClick(wallet.id)}
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

       {/* Add Wallet Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <form action={createFormAction}>
                <DialogHeader>
                    <DialogTitle>إضافة محفظة جديدة</DialogTitle>
                    <DialogDescription>
                    املأ البيانات التالية لإنشاء محفظة أو خزينة جديدة.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="wallet-name">اسم المحفظة</Label>
                        <Input id="wallet-name" name="name" placeholder="e.g., خزينة الدير الرئيسية" />
                        {createState?.errors?.name && <p className="text-xs text-red-500">{createState.errors.name[0]}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="wallet-balance">الرصيد الافتتاحي</Label>
                        <Input id="wallet-balance" name="balance" type="number" placeholder="e.g., 10000" defaultValue={0} />
                        {createState?.errors?.balance && <p className="text-xs text-red-500">{createState.errors.balance[0]}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="wallet-icon">النوع</Label>
                         <select name="icon" id="wallet-icon" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            <option value="wallet">محفظة عامة</option>
                            <option value="cash">خزينة نقدية</option>
                        </select>
                        {createState?.errors?.icon && <p className="text-xs text-red-500">{createState.errors.icon[0]}</p>}
                    </div>
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
      
      {/* Edit Wallet Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
             <form action={updateFormAction}>
                <DialogHeader>
                    <DialogTitle>تعديل المحفظة: {selectedWallet?.name}</DialogTitle>
                    <DialogDescription>
                        قم بتحديث بيانات المحفظة أدناه. لا يمكن تعديل الرصيد من هنا.
                    </DialogDescription>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-wallet-name">اسم المحفظة</Label>
                        <Input id="edit-wallet-name" name="name" defaultValue={selectedWallet?.name} />
                         {updateState?.errors?.name && <p className="text-xs text-red-500">{updateState.errors.name[0]}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-wallet-icon">النوع</Label>
                        <select name="icon" id="edit-wallet-icon" defaultValue={selectedWallet?.icon} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            <option value="wallet">محفظة عامة</option>
                            <option value="cash">خزينة نقدية</option>
                        </select>
                         {updateState?.errors?.icon && <p className="text-xs text-red-500">{updateState.errors.icon[0]}</p>}
                    </div>
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

    