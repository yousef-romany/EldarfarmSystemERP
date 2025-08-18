
'use client'

import { PlusCircle, FileText, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { expenses, wallets } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import type { Expense, Payment } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from '@/components/ui/dropdown-menu';

export default function ExpensesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [payments, setPayments] = useState<Partial<Payment[]>>([{}]);
  const [totalCost, setTotalCost] = useState<number>(0);

  const totalPaid = payments.reduce((acc, p) => acc + (p?.amount || 0), 0);
  const remainingBalance = totalCost - totalPaid;

  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);

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
  
  const getWalletName = (walletId: string | undefined) => {
    if (!walletId) return 'غير محدد';
    return wallets.find(w => w.id === walletId)?.name || 'غير محدد';
  }
  
  const handleAddPayment = () => {
    setPayments([...payments, {}]);
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };
  
  const handlePaymentChange = (index: number, field: keyof Omit<Payment, 'date'>, value: string | number) => {
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
  }


  return (
    <>
      <PageHeader
        title="إدارة المصروفات"
        action={
          <Button onClick={handleOpenDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            إضافة مصروف
          </Button>
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
                <TableRow key={expense.id}>
                  <TableCell>{format(new Date(expense.date), 'yyyy-MM-dd')}</TableCell>
                  <TableCell>
                    <Badge variant={getCategoryVariant(expense.category)}>{getCategoryText(expense.category)}</Badge>
                  </TableCell>
                  <TableCell>{expense.description}</TableCell>
                   <TableCell>{getWalletName(expense.payment?.walletId)}</TableCell>
                  <TableCell className="text-left font-medium">
                    {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(expense.amount)}
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
                        <DropdownMenuItem>تعديل</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
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
      
      {/* Add Expense Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة مصروف جديد</DialogTitle>
            <DialogDescription>
              املأ البيانات التالية لتسجيل مصروف جديد.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="expense-date">التاريخ</Label>
                    <Input id="expense-date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="expense-category">النوع</Label>
                     <Select>
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
                </div>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="expense-description">الوصف</Label>
                <Input id="expense-description" placeholder="e.g., شراء علف ذرة, تحصينات دورية" />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="expense-amount">المبلغ الإجمالي</Label>
                <Input id="expense-amount" type="number" placeholder="تكلفة المصروف" onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)} />
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
                        <Select onValueChange={(value) => handlePaymentChange(index, 'walletId', value)}>
                          <SelectTrigger id={`wallet-${index}`}>
                            <SelectValue placeholder="اختر محفظة..." />
                          </SelectTrigger>
                          <SelectContent>
                            {wallets.map((wallet) => (
                              <SelectItem key={wallet.id} value={wallet.id}>
                                {wallet.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`amount-${index}`}>المبلغ</Label>
                        <Input id={`amount-${index}`} type="number" placeholder="المبلغ" onChange={(e) => handlePaymentChange(index, 'amount', Number(e.target.value))} />
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
                  <span className='font-semibold'>المبلغ المتبقي:</span>
                  <span className='font-bold text-lg text-destructive'>
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
            <Button type="submit" disabled={!totalCost || remainingBalance !== 0}>حفظ المصروف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
