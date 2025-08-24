
'use client'

import { PlusCircle, FileText, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useState, useEffect, useActionState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { createExpense, deleteExpense, ExpenseState } from '@/lib/actions/expense.actions';
import type { Expense, Wallet, Payment } from '@prisma/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { useSession } from '@/components/session-provider';

type ExpenseWithDetails = Expense & {
    payments: (Payment & { wallet: Wallet })[]
};

type PaymentDetails = {
  walletId: string;
  amount: number;
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? 'جاري الحفظ...' : 'حفظ المصروف'}
    </Button>
  );
}

export default function ExpensesClientPage({ expenses, wallets, totalExpenses }: { expenses: ExpenseWithDetails[], wallets: Wallet[], totalExpenses: number }) {
  const { user } = useSession();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form state
  const initialState: ExpenseState = { message: null, errors: {}, success: false };
  const [createState, createFormAction] = useActionState(createExpense, initialState);
  
  const [payments, setPayments] = useState<Partial<PaymentDetails>[]>([{}]);
  const [totalCost, setTotalCost] = useState<number>(0);

  const totalPaid = payments.reduce((acc, p) => acc + (p?.amount || 0), 0);
  const remainingBalance = totalCost - totalPaid;

  useEffect(() => {
    if (createState.success) {
      toast({ title: 'نجاح', description: createState.message });
      setIsAddDialogOpen(false);
      handleOpenDialog(); // Reset dialog state
    } else if (createState.message && !createState.success) {
      toast({ title: 'خطأ', description: createState.message, variant: 'destructive' });
    }
  }, [createState, toast]);


  const getCategoryText = (category: Expense['category']) => {
    switch (category) {
      case 'Feed': return 'علف';
      case 'Vet': return 'بيطري';
      case 'Maintenance': return 'صيانة';
      case 'Other': return 'أخرى';
    }
  }

  const getCategoryVariant = (category: Expense['category']) => {
    switch (category) {
      case 'Feed': return 'default';
      case 'Vet': return 'destructive';
      case 'Maintenance': return 'secondary';
      case 'Other': return 'outline';
    }
  }
  
  const getWalletName = (payment?: { wallet: Wallet }) => {
    return payment?.wallet.name || 'غير محدد';
  }
  
  const handleAddPayment = () => {
    setPayments([...payments, {}]);
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };
  
  const handlePaymentChange = (index: number, field: keyof Omit<PaymentDetails, 'date'>, value: string | number) => {
    const newPayments = [...payments.map(p => ({...p}))];
    const payment = newPayments[index] || {};
    (payment as any)[field] = value;
    newPayments[index] = payment;
    setPayments(newPayments);
  };
  
  const handleOpenDialog = () => {
      setPayments([{}]);
      setTotalCost(0);
      setIsAddDialogOpen(true);
      // Reset form state if needed, though useFormState should handle this.
  }
  
  const handleDelete = async (id: string) => {
    const result = await deleteExpense(id);
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
    <>
      <PageHeader
        title="إدارة المصروفات"
        action={
          user?.permissions.expenses.add && (
            <Button onClick={handleOpenDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              إضافة مصروف
            </Button>
          )
        }
      />
      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(totalExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <h3 className="text-lg font-semibold">سجل المصروفات</h3>
            <div className="ml-auto flex items-center gap-2">
              <Select>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="فلترة بالنوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="Feed">علف</SelectItem>
                  <SelectItem value="Vet">بيطري</SelectItem>
                  <SelectItem value="Maintenance">صيانة</SelectItem>
                  <SelectItem value="Other">أخرى</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-[280px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>اختر نطاق زمني</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="range" numberOfMonths={2} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>مصدر الدفع</TableHead>
                <TableHead className="text-left">المبلغ</TableHead>
                <TableHead><span className="sr-only">الإجراءات</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <AlertDialog key={expense.id}>
                <TableRow>
                  <TableCell>{format(new Date(expense.date), 'yyyy-MM-dd')}</TableCell>
                  <TableCell>
                    <Badge variant={getCategoryVariant(expense.category)}>{getCategoryText(expense.category)}</Badge>
                  </TableCell>
                  <TableCell>{expense.description}</TableCell>
                   <TableCell>{expense.payments.map(p => p.wallet.name).join(', ')}</TableCell>
                  <TableCell className="text-left font-medium">
                    {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(expense.amount as number)}
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
                        {user?.permissions.expenses.edit && (
                            <DropdownMenuItem asChild>
                                <Link href={`/expenses/edit/${expense.id}`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    تعديل
                                </Link>
                            </DropdownMenuItem>
                        )}
                        {user?.permissions.expenses.delete && (
                            <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                حذف
                            </DropdownMenuItem>
                            </AlertDialogTrigger>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        سيتم حذف هذا المصروف نهائيًا. سيؤثر هذا على أرصدة المحافظ. لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(expense.id)}
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
      
      {/* Add Expense Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form action={createFormAction}>
            <DialogHeader>
              <DialogTitle>إضافة مصروف جديد</DialogTitle>
              <DialogDescription>
                املأ البيانات التالية لتسجيل مصروف جديد.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <input type="hidden" name="payments" value={JSON.stringify(payments.filter(p => p.walletId && p.amount))} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                      <Label htmlFor="expense-date">التاريخ</Label>
                      <Input id="expense-date" name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                       {createState?.errors?.date && <p className="col-span-4 text-xs text-red-500">{createState.errors.date[0]}</p>}
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="expense-category">النوع</Label>
                       <Select name="category">
                          <SelectTrigger id="expense-category">
                          <SelectValue placeholder="اختر نوع المصروف" />
                          </SelectTrigger>
                          <SelectContent>
                          <SelectItem value="Feed">علف</SelectItem>
                          <SelectItem value="Vet">بيطري</SelectItem>
                          <SelectItem value="Maintenance">صيانة</SelectItem>
                          <SelectItem value="Other">أخرى</SelectItem>
                          </SelectContent>
                      </Select>
                       {createState?.errors?.category && <p className="col-span-4 text-xs text-red-500">{createState.errors.category[0]}</p>}
                  </div>
              </div>
               <div className="grid gap-2">
                  <Label htmlFor="expense-description">الوصف</Label>
                  <Input id="expense-description" name="description" placeholder="e.g., شراء علف ذرة, تحصينات دورية" />
                   {createState?.errors?.description && <p className="col-span-4 text-xs text-red-500">{createState.errors.description[0]}</p>}
              </div>
               <div className="grid gap-2">
                  <Label htmlFor="expense-amount">المبلغ الإجمالي</Label>
                  <Input id="expense-amount" name="amount" type="number" placeholder="تكلفة المصروف" onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)} />
                   {createState?.errors?.amount && <p className="col-span-4 text-xs text-red-500">{createState.errors.amount[0]}</p>}
              </div>
               <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>تفاصيل الدفع</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className="space-y-3">
                    {payments.map((payment, index) => (
                      <div key={index} className="flex items-end gap-2 p-2 border rounded-md">
                        <div className="grid gap-2 flex-1">
                          <Label htmlFor={`wallet-${index}`}>المحفظة / الحساب</Label>
                          <Select value={payment?.walletId} onValueChange={(value) => handlePaymentChange(index, 'walletId', value)}>
                            <SelectTrigger id={`wallet-${index}`}>
                              <SelectValue placeholder="اختر محفظة..." />
                            </SelectTrigger>
                            <SelectContent>
                              {wallets.map((wallet) => (
                                <SelectItem key={wallet.id} value={wallet.id}>
                                  {wallet.name} (الرصيد: {Number(wallet.balance).toLocaleString()})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`amount-${index}`}>المبلغ</Label>
                          <Input id={`amount-${index}`} type="number" placeholder="المبلغ" value={payment?.amount || ''} onChange={(e) => handlePaymentChange(index, 'amount', Number(e.target.value))} />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePayment(index)}
                          disabled={payments.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddPayment}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    إضافة دفعة أخرى
                  </Button>
                </CardContent>
                 <CardContent>
                  <div className='flex justify-between items-center p-3 bg-muted rounded-md mb-2'>
                    <span className='font-semibold'>الإجمالي المدفوع:</span>
                    <span className='font-bold text-lg'>
                      {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(totalPaid)}
                    </span>
                  </div>
                  <div className='flex justify-between items-center p-3 bg-muted rounded-md'>
                    <span className='font-semibold'>الفرق:</span>
                     <span className={`font-bold text-lg ${remainingBalance === 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(remainingBalance)}
                    </span>
                  </div>
                </CardContent>
              </Card>

            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  إلغاء
                </Button>
              </DialogClose>
              <SubmitButton disabled={!totalCost || remainingBalance !== 0} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
