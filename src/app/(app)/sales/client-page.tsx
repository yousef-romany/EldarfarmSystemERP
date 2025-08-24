
'use client';
import { MoreHorizontal, PlusCircle, Trash2, ChevronsUpDown, Check, ArrowDownUp, Printer, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { format } from 'date-fns';
import { useState, useEffect, useActionState } from 'react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { createSale, settleSale, deleteSale } from '@/lib/actions/sale.actions';
import type { Livestock, Sale, Wallet } from '@prisma/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


type SaleWithLivestock = Sale & {
    livestock: {
        tagId: string | null;
        isBatch: boolean;
        quantity: number | null;
    }
};

type PaymentDetails = {
    walletId: string;
    amount: number;
}


function SubmitButton({ text, disabled }: { text: string, disabled?: boolean}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? 'جاري الحفظ...' : text}
    </Button>
  );
}

export default function SalesPageClient({ sales, availableLivestock, wallets }: { sales: SaleWithLivestock[], availableLivestock: Livestock[], wallets: Wallet[]}) {
  const { toast } = useToast();
  const [createState, createFormAction] = useActionState(createSale, { message: null, errors: {}, success: false });

  // State for Sale
  const [payments, setPayments] = useState<Partial<PaymentDetails>[]>([{}]);
  const [selectedAnimal, setSelectedAnimal] = useState<Livestock | null>(null);
  const [pricePerKg, setPricePerKg] = useState<number>(0);
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [isDeferredSale, setIsDeferredSale] = useState(false);

  // State for Deferred Sale Settlement
  const [isSettlementDialogOpen, setIsSettlementDialogOpen] = useState(false);
  const [settlementSale, setSettlementSale] = useState<Sale | null>(null);
  const [finalWeight, setFinalWeight] = useState(0);
  const [settlementPricePerKg, setSettlementPricePerKg] = useState(0);
  const [finalTotalPrice, setFinalTotalPrice] = useState(0);
  const [settlementPayments, setSettlementPayments] = useState<Partial<PaymentDetails>[]>([{}]);
  
  const totalPaid = payments.reduce((acc, p) => acc + (p?.amount || 0), 0);
  const remainingBalance = totalPrice - totalPaid;

  const settlementTotalPaid = settlementPayments.reduce((acc, p) => acc + (p?.amount || 0), 0);
  const settlementRemainingBalance = finalTotalPrice - (settlementSale?.amountPaid.toNumber() || 0) - settlementTotalPaid;
  const weightDifference = settlementSale ? finalWeight - (settlementSale.initialWeight?.toNumber() || 0) : 0;

  // Form state for settlement action
  const settleSaleWithId = settlementSale ? settleSale.bind(null, settlementSale.id) : async () => {};
  const [settleState, settleFormAction] = useActionState(settleSaleWithId, { message: null, errors: {}, success: false });

  const getAnimalTag = (sale: SaleWithLivestock) => {
    const { livestock } = sale;
    if (livestock.isBatch) return `دفعة (${livestock.quantity} رأس)`;
    return livestock.tagId || 'N/A';
  };
  
  const handlePrint = (saleId: string) => {
    const url = `/sales/invoice/${saleId}`;
    window.open(url, '_blank');
  };
  
  const handleDelete = async (id: string) => {
    const result = await deleteSale(id);
    if (result.success) {
      toast({ title: 'نجاح', description: result.message });
    } else {
      toast({ title: 'خطأ', description: result.message, variant: 'destructive' });
    }
  }
  
  useEffect(() => {
    if (createState?.success) {
      toast({ title: 'نجاح', description: createState.message });
      // Reset form state
      setSelectedAnimal(null);
      setPricePerKg(0);
      setCurrentWeight(0);
      setTotalPrice(0);
      setPayments([{}]);
      setCustomerName('');
      setIsDeferredSale(false);
    } else if (createState?.message && !createState?.success) {
      toast({ title: 'خطأ', description: createState.message, variant: 'destructive' });
    }
  }, [createState, toast]);

  useEffect(() => {
    if (settleState?.success) {
        toast({ title: 'نجاح', description: settleState.message });
        setIsSettlementDialogOpen(false);
    } else if (settleState?.message && !settleState.success) {
        toast({ title: 'خطأ', description: settleState.message, variant: 'destructive' });
    }
  }, [settleState, toast])
  
  // Handlers for Sale
  const handleAddPayment = () => {
    setPayments([...payments, {}]);
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };
  
  const handlePaymentChange = (index: number, field: keyof PaymentDetails, value: string | number) => {
    const newPayments = [...payments.map(p => ({...p}))] as Partial<PaymentDetails>[];
    const payment = newPayments[index] || {};
    (payment as any)[field] = value;
    newPayments[index] = payment;
    setPayments(newPayments);
  };

  useEffect(() => {
    if (selectedAnimal) {
      setTotalPrice(currentWeight * pricePerKg);
    } else {
      setTotalPrice(0);
    }
  }, [selectedAnimal, currentWeight, pricePerKg]);

  const handleAnimalSelect = (animalId: string) => {
    const animal = availableLivestock.find(a => a.id === animalId);
    setSelectedAnimal(animal || null);
    if (animal) {
      setCurrentWeight(animal.weight.toNumber());
    } else {
      setCurrentWeight(0);
    }
    setComboboxOpen(false);
  };
  
  // Handlers for Deferred Sale Settlement
  const openSettlementDialog = (sale: Sale) => {
    setSettlementSale(sale);
    setFinalWeight(sale.initialWeight?.toNumber() || 0);
    const calculatedPricePerKg = sale.pricePerKg.toNumber() || sale.totalPrice.toNumber() / (sale.initialWeight?.toNumber() || 1);
    setSettlementPricePerKg(calculatedPricePerKg);
    setSettlementPayments([{}]);
    setIsSettlementDialogOpen(true);
  };
  
  useEffect(() => {
    if (settlementSale) {
        setFinalTotalPrice(finalWeight * settlementPricePerKg);
    }
  }, [settlementSale, finalWeight, settlementPricePerKg]);

  const handleAddSettlementPayment = () => {
    setSettlementPayments([...settlementPayments, {}]);
  };

  const handleRemoveSettlementPayment = (index: number) => {
    const newPayments = [...settlementPayments];
    newPayments.splice(index, 1);
    setSettlementPayments(newPayments);
  };

  const handleSettlementPaymentChange = (index: number, field: keyof PaymentDetails, value: string | number) => {
    const newPayments = [...settlementPayments.map(p => ({...p}))] as Partial<PaymentDetails>[];
    const payment = newPayments[index] || {};
    (payment as any)[field] = value;
    newPayments[index] = payment;
    setSettlementPayments(newPayments);
  };


  return (
    <>
      <PageHeader title="إدارة المبيعات" />
      <Tabs defaultValue="list" dir="rtl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">قائمة المبيعات</TabsTrigger>
          <TabsTrigger value="new">إضافة عملية بيع</TabsTrigger>
        </TabsList>
         <TabsContent value="list">
            <Card>
                <CardHeader>
                    <CardTitle>سجل المبيعات</CardTitle>
                    <CardDescription>عرض لجميع عمليات البيع المسجلة في النظام.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>العميل</TableHead>
                            <TableHead>الحيوان</TableHead>
                            <TableHead>تاريخ البيع</TableHead>
                             <TableHead>النوع</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>
                            <span className="sr-only">الإجراءات</span>
                            </TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {sales.map((sale) => (
                           <AlertDialog key={sale.id}>
                            <TableRow>
                                <TableCell className="font-medium">{sale.customerName}</TableCell>
                                <TableCell>{getAnimalTag(sale)}</TableCell>
                                <TableCell>{format(new Date(sale.saleDate), 'yyyy-MM-dd')}</TableCell>
                                <TableCell>
                                    <Badge variant={sale.type === 'Deferred' ? 'secondary' : 'default'}>
                                        {sale.type === 'Deferred' ? 'آجل' : 'فوري'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                <Badge variant={sale.status === 'Completed' ? 'default' : 'secondary'}>
                                    {sale.status === 'Completed' ? 'مكتمل' : 'قيد الانتظار'}
                                </Badge>
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
                                        {sale.status === 'Pending' && (
                                            <DropdownMenuItem onClick={() => openSettlementDialog(sale)}>
                                                <ArrowDownUp className="mr-2 h-4 w-4" />
                                                تحديث الوزن و إتمام البيع
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem asChild>
                                            <Link href={`/sales/edit/${sale.id}`}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                تعديل
                                            </Link>
                                        </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePrint(sale.id)}>
                                        <Printer className="mr-2 h-4 w-4" />
                                        طباعة الفاتورة
                                    </DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        إلغاء العملية
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
                                    سيتم إلغاء هذه العملية نهائيًا. سيؤثر هذا على أرصدة المحافظ وحالة الحيوان. لا يمكن التراجع عن هذا الإجراء.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction
                                    onClick={() => handleDelete(sale.id)}
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
        </TabsContent>
        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>تسجيل عملية بيع جديدة</CardTitle>
              <CardDescription>
                سجل من هنا عمليات البيع الفورية أو الآجلة.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={createFormAction}>
                  <input type="hidden" name="isDeferred" value={String(isDeferredSale)} />
                  <input type="hidden" name="payments" value={JSON.stringify(payments.filter(p=>p.walletId && p.amount))} />
                  <input type="hidden" name="livestockId" value={selectedAnimal?.id || ''} />
                  <input type="hidden" name="initialWeight" value={currentWeight} />
                  <input type="hidden" name="pricePerKg" value={pricePerKg} />
                  <input type="hidden" name="totalPrice" value={totalPrice} />
                  <input type="hidden" name="saleDate" value={format(new Date(), 'yyyy-MM-dd')} />


                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="animal-select">اختر الحيوان</Label>
                      <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={comboboxOpen}
                            className="w-full justify-between"
                          >
                            {selectedAnimal
                              ? `${selectedAnimal.tagId} - ${selectedAnimal.breed} - ${selectedAnimal.weight} كجم`
                              : "اختر حيوانًا..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="ابحث بالرقم التعريفي..." />
                            <CommandList>
                              <CommandEmpty>لم يتم العثور على حيوان.</CommandEmpty>
                              <CommandGroup>
                                {availableLivestock.map((animal) => (
                                    <CommandItem
                                      key={animal.id}
                                      value={animal.id}
                                      onSelect={() => handleAnimalSelect(animal.id)}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedAnimal?.id === animal.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {animal.tagId} - {animal.breed} - {animal.weight.toNumber()} كجم
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="customer-name">اسم العميل</Label>
                      <Input name="customerName" id="customer-name" placeholder="اسم المشتري" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                    </div>
                  </div>
                  
                  {selectedAnimal && (
                    <Card className="my-4">
                      <CardHeader>
                          <CardTitle className='text-lg'>تفاصيل السعر</CardTitle>
                      </CardHeader>
                      <CardContent className='grid md:grid-cols-3 gap-4'>
                        <div className="grid gap-2">
                          <Label htmlFor="current-weight">الوزن الحالي (كجم)</Label>
                          <Input id="current-weight" type="number" value={currentWeight} onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="price-per-kg">سعر الكيلو (ج.م)</Label>
                          <Input id="price-per-kg" type="number" placeholder="أدخل سعر الكيلو" value={pricePerKg} onChange={(e) => setPricePerKg(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="total-price-display">السعر الإجمالي</Label>
                          <Input id="total-price-display" type="number" value={totalPrice} readOnly />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                        <CardTitle className='text-lg'>تفاصيل الدفع</CardTitle>
                        <CardDescription>أضف الدفعات المستلمة من العميل.</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className="space-y-3">
                        {payments.map((payment, index) => (
                          <div key={index} className="flex items-end gap-2 p-2 border rounded-md">
                            <div className="grid gap-2 flex-1">
                              <Label htmlFor={`wallet-${index}`}>المحفظة / الحساب</Label>
                              <Select value={payment.walletId} onValueChange={(value) => handlePaymentChange(index, 'walletId', value)}>
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
                          <span className='font-semibold'>المبلغ المتبقي:</span>
                           <span className={`font-bold text-lg ${remainingBalance === 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(remainingBalance)}
                          </span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end mt-4 gap-4">
                     <Button type="button" variant="secondary" onClick={() => { setIsDeferredSale(true); document.getElementById('submit-sale-button')?.click(); }}>تسجيل كبيع آجل</Button>
                     <Button id="submit-sale-button" type="submit" onClick={() => setIsDeferredSale(false)} disabled={!selectedAnimal || !pricePerKg || remainingBalance !== 0}>تسجيل كبيع فوري</Button>
                  </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Deferred Sale Settlement Dialog */}
      <Dialog open={isSettlementDialogOpen} onOpenChange={setIsSettlementDialogOpen}>
        <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>إتمام عملية بيع آجل</DialogTitle>
            <DialogDescription>
              تحديث الوزن النهائي وتسوية المبلغ المتبقي للعميل: {settlementSale?.customerName}
            </DialogDescription>
          </DialogHeader>
          {settlementSale && (
           <form action={settleFormAction} className="space-y-4 py-4 overflow-y-auto flex-1 pr-6">
                <input type="hidden" name="payments" value={JSON.stringify(settlementPayments.filter(p => p.walletId && p.amount))} />
                <input type="hidden" name="finalWeight" value={finalWeight} />

              <Card>
                <CardHeader>
                    <CardTitle className="text-lg">ملخص الاتفاق الأولي</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                     <div className="grid gap-1">
                        <Label className="text-sm text-muted-foreground">الوزن الأولي</Label>
                        <p className="font-semibold">{settlementSale.initialWeight?.toNumber()} كجم</p>
                    </div>
                    <div className="grid gap-1">
                        <Label className="text-sm text-muted-foreground">سعر الكيلو المتفق عليه</Label>
                        <p className="font-semibold">{new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(settlementPricePerKg)}</p>
                    </div>
                    <div className="grid gap-1">
                        <Label className="text-sm text-muted-foreground">العربون المدفوع</Label>
                        <p className="font-semibold">{new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(settlementSale.amountPaid.toNumber() || 0)}</p>
                    </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className='text-lg'>تحديث الوزن والتسعير النهائي</CardTitle>
                </CardHeader>
                <CardContent className='grid md:grid-cols-3 gap-4'>
                    <div className="grid gap-2">
                      <Label htmlFor="final-weight">الوزن النهائي (كجم)</Label>
                      <Input id="final-weight" name="finalWeight" type="number" value={finalWeight} onChange={(e) => setFinalWeight(parseFloat(e.target.value) || 0)} />
                       {settleState.errors?.finalWeight && <p className="text-xs text-red-500">{settleState.errors.finalWeight[0]}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label>فرق الوزن</Label>
                        <div className={cn("flex items-center justify-center h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm", weightDifference >= 0 ? "text-green-600" : "text-red-600")}>
                            <ArrowDownUp className="mr-2 h-4 w-4" />
                            <span className="font-bold">{weightDifference.toFixed(2)} كجم</span>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="final-total-price">السعر الإجمالي النهائي</Label>
                        <Input id="final-total-price" type="number" value={finalTotalPrice.toFixed(2)} readOnly className='font-bold' />
                    </div>
                </CardContent>
              </Card>
              
               <Card>
                <CardHeader>
                    <CardTitle className='text-lg'>تسوية المبلغ المتبقي</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className="space-y-3">
                    {settlementPayments.map((payment, index) => (
                      <div key={index} className="flex items-end gap-2 p-2 border rounded-md">
                        <div className="grid gap-2 flex-1">
                          <Label htmlFor={`settlement-wallet-${index}`}>المحفظة / الحساب</Label>
                          <Select value={payment.walletId} onValueChange={(value) => handleSettlementPaymentChange(index, 'walletId', value)}>
                            <SelectTrigger id={`settlement-wallet-${index}`}>
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
                          <Label htmlFor={`settlement-amount-${index}`}>المبلغ</Label>
                          <Input id={`settlement-amount-${index}`} type="number" placeholder="المبلغ" value={payment?.amount || ''} onChange={(e) => handleSettlementPaymentChange(index, 'amount', Number(e.target.value))} />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSettlementPayment(index)}
                          disabled={settlementPayments.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                     {settleState.errors?.payments && <p className="text-xs text-red-500">{settleState.errors.payments[0]}</p>}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddSettlementPayment}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    إضافة دفعة أخرى
                  </Button>
                </CardContent>
                <CardContent>
                   <div className='flex justify-between items-center p-3 bg-muted rounded-md mb-2'>
                        <span className='font-semibold'>الإجمالي المدفوع (شامل العربون):</span>
                        <span className='font-bold text-lg'>
                        {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format((settlementSale.amountPaid.toNumber() || 0) + settlementTotalPaid)}
                        </span>
                    </div>
                    <div className='flex justify-between items-center p-3 bg-muted rounded-md'>
                        <span className='font-semibold'>المبلغ المطلوب للتسوية:</span>
                        <span className='font-bold text-lg text-destructive'>
                        {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(settlementRemainingBalance)}
                        </span>
                    </div>
                </CardContent>
              </Card>

              <DialogFooter className="gap-2 sm:justify-between sticky bottom-0 bg-background pt-4">
                <Button type="button" variant="outline" onClick={() => settlementSale && handlePrint(settlementSale!.id)}>
                    <Printer className="mr-2 h-4 w-4" />
                    طباعة الفاتورة
                </Button>
                <div className='flex gap-2'>
                    <DialogClose asChild>
                    <Button type="button" variant="secondary">إلغاء</Button>
                    </DialogClose>
                    <SubmitButton text="إتمام البيع والتسوية" disabled={settlementRemainingBalance !== 0} />
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
