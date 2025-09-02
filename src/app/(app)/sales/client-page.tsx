
'use client';
import { MoreHorizontal, Trash2, Printer, Pencil, ArrowDownUp, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useState, useEffect, useActionState, useRef } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { settleSale, deleteSale, confirmSale } from '@/lib/actions/sale.actions';
import type { Livestock, Sale, Wallet } from '@prisma/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useSession } from '@/components/session-provider';
import useSWR from 'swr';


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

const fetcher = (url: string) => fetch(url).then(res => res.json());


function SubmitButton({ text, disabled, name, value, variant }: { text: string, disabled?: boolean, name?: string, value?: string, variant?: "default" | "secondary" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name={name} value={value} disabled={pending || disabled} variant={variant}>
      {pending ? 'جاري الحفظ...' : text}
    </Button>
  );
}

export default function SalesPageClient({ wallets }: { wallets: Wallet[]}) {
  const { toast } = useToast();
  const { user } = useSession();

  // --- Data Fetching with SWR for real-time updates ---
  const { data: sales, error, mutate } = useSWR<SaleWithLivestock[]>('/api/sales', fetcher, {
    refreshInterval: 10000, // Refresh every 10 seconds
    revalidateOnFocus: true,
  });

  const draftCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio only on client
    audioRef.current = new Audio('/notification.mp3');
  }, []);

  useEffect(() => {
    if (sales) {
      const newDraftCount = sales.filter(p => p.status === 'Draft').length;
      if (newDraftCount > draftCount.current && user?.permissions.sales.confirm) {
        // New draft arrived, play sound for users who can confirm
        audioRef.current?.play().catch(e => console.error("Error playing sound:", e));
      }
      draftCount.current = newDraftCount;
    }
  }, [sales, user]);

  // State for Deferred Sale Settlement
  const [isSettlementDialogOpen, setIsSettlementDialogOpen] = useState(false);
  const [settlementSale, setSettlementSale] = useState<Sale | null>(null);
  const [finalWeight, setFinalWeight] = useState(0);
  const [settlementPricePerKg, setSettlementPricePerKg] = useState(0);
  const [finalTotalPrice, setFinalTotalPrice] = useState(0);
  const [settlementPayments, setSettlementPayments] = useState<Partial<PaymentDetails>[]>([{}]);
  
  const settlementTotalPaid = settlementPayments.reduce((acc, p) => acc + (p?.amount || 0), 0);
  const settlementRemainingBalance = finalTotalPrice - (settlementSale?.amountPaid || 0) - settlementTotalPaid;
  const weightDifference = settlementSale ? finalWeight - (settlementSale.initialWeight || 0) : 0;

  // Form state for settlement action
  const settleSaleWithId = settlementSale ? settleSale.bind(null, settlementSale.id) : async () => {};
  const [settleState, settleFormAction] = useActionState(settleSaleWithId, { message: null, errors: {}, success: false });

  // Form state for confirmation action
  const [confirmState, confirmFormAction] = useActionState(confirmSale, { message: null, success: false });


  const getAnimalTag = (sale: SaleWithLivestock) => {
    const { livestock } = sale;
    if (livestock.isBatch) return `دفعة (${sale.quantitySold} رأس)`;
    return livestock.tagId || 'N/A';
  };
  
  const handlePrint = (saleId: string, type: 'invoice' | 'receipt') => {
    const url = `/sales/${type}/${saleId}`;
    window.open(url, '_blank');
  };
  
  const handleDelete = async (id: string) => {
    const result = await deleteSale(id);
    if (result.success) {
      toast({ title: 'نجاح', description: result.message });
      mutate();
    } else {
      toast({ title: 'خطأ', description: result.message, variant: 'destructive' });
    }
  }
  
  useEffect(() => {
    if (settleState?.success) {
        toast({ title: 'نجاح', description: settleState.message });
        setIsSettlementDialogOpen(false);
        mutate();
    } else if (settleState?.message && !settleState.success) {
        toast({ title: 'خطأ', description: settleState.message, variant: 'destructive' });
    }
  }, [settleState, toast, mutate])

  useEffect(() => {
    if (confirmState.success) {
      toast({ title: 'نجاح', description: confirmState.message });
      mutate();
    } else if (confirmState.message && !confirmState.success) {
      toast({ title: 'خطأ', description: confirmState.message, variant: 'destructive' });
    }
  }, [confirmState, toast, mutate]);
  

  // Handlers for Deferred Sale Settlement
  const openSettlementDialog = (sale: Sale) => {
    setSettlementSale(sale);
    setFinalWeight(sale.initialWeight || 0);
    const calculatedPricePerKg = sale.pricePerKg || sale.totalPrice / (sale.initialWeight || 1);
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

  const getStatusBadge = (status: Sale['status']) => {
    switch (status) {
      case 'Draft': return <Badge variant="secondary">مسودة</Badge>;
      case 'Pending': return <Badge variant="outline">قيد التسوية</Badge>;
      case 'Completed': return <Badge variant="default">مكتمل</Badge>;
      case 'Cancelled': return <Badge variant="destructive">ملغاة</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  }


  return (
    <>
      <Card>
          <CardHeader>
              <CardTitle>قائمة عمليات البيع</CardTitle>
              <CardDescription>عرض لجميع عمليات البيع المسجلة في النظام.</CardDescription>
          </CardHeader>
            <CardContent>
              <Table>
                  <TableHeader>
                  <TableRow>
                      <TableHead>الحالة</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>الحيوان</TableHead>
                      <TableHead>تاريخ البيع</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>
                      <span className="sr-only">الإجراءات</span>
                      </TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {error && <TableRow><TableCell colSpan={6} className='text-center text-destructive'>فشل في تحميل البيانات.</TableCell></TableRow>}
                  {!sales && !error && <TableRow><TableCell colSpan={6} className='text-center'>جاري التحميل...</TableCell></TableRow>}
                  {sales && sales.map((sale) => (
                      <AlertDialog key={sale.id}>
                      <TableRow className={sale.status === 'Draft' ? 'bg-muted/50' : ''}>
                          <TableCell>{getStatusBadge(sale.status)}</TableCell>
                          <TableCell className="font-medium">{sale.customerName}</TableCell>
                          <TableCell>{getAnimalTag(sale)}</TableCell>
                          <TableCell>{format(new Date(sale.saleDate), 'yyyy-MM-dd')}</TableCell>
                          <TableCell>
                              <Badge variant={sale.type === 'Deferred' ? 'secondary' : 'default'}>
                                  {sale.type === 'Deferred' ? 'آجل' : 'فوري'}
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
                                    {sale.status === 'Draft' && user?.permissions.sales.confirm && (
                                        <AlertDialogTrigger asChild>
                                          <DropdownMenuItem className="text-green-600" onSelect={(e) => e.preventDefault()}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            تأكيد العملية
                                          </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    )}
                                    {sale.status === 'Pending' && user?.permissions.deferredSales.edit && (
                                        <DropdownMenuItem onClick={() => openSettlementDialog(sale as Sale)}>
                                            <ArrowDownUp className="mr-2 h-4 w-4" />
                                            تحديث الوزن و إتمام البيع
                                        </DropdownMenuItem>
                                    )}
                                    {sale.status === 'Draft' && (
                                      <DropdownMenuItem asChild>
                                          <Link href={`/sales/edit/${sale.id}`}>
                                              <Pencil className="mr-2 h-4 w-4" />
                                              تعديل
                                          </Link>
                                      </DropdownMenuItem>
                                    )}
                                <DropdownMenuItem onClick={() => handlePrint(sale.id, 'invoice')}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    طباعة فاتورة (A4)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePrint(sale.id, 'receipt')}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    طباعة إيصال (POS)
                                </DropdownMenuItem>
                                {user?.permissions.sales.delete && (
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      إلغاء العملية
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                      </TableRow>
                       <AlertDialogContent>
                        {sale.status === 'Draft' ? (
                          <form id={`confirm-sale-form-${sale.id}`} action={confirmFormAction}>
                            <input type="hidden" name="saleId" value={sale.id} />
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد عملية البيع؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                سيؤدي هذا الإجراء إلى إتمام عملية البيع، وخصم المبلغ من المحفظة، وتغيير حالة الحيوان. لا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <Button type="submit" form={`confirm-sale-form-${sale.id}`}>نعم، قم بالتأكيد</Button>
                            </AlertDialogFooter>
                          </form>
                        ) : (
                          <>
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
                          </>
                        )}
                      </AlertDialogContent>
                      </AlertDialog>
                      ))}
                      {sales && sales.length === 0 && <TableRow><TableCell colSpan={6} className='text-center'>لا توجد مبيعات مسجلة.</TableCell></TableRow>}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
      
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
                        <p className="font-semibold">{settlementSale.initialWeight} كجم</p>
                    </div>
                    <div className="grid gap-1">
                        <Label className="text-sm text-muted-foreground">سعر الكيلو المتفق عليه</Label>
                        <p className="font-semibold">{new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(settlementPricePerKg)}</p>
                    </div>
                    <div className="grid gap-1">
                        <Label className="text-sm text-muted-foreground">العربون المدفوع</Label>
                        <p className="font-semibold">{new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(settlementSale.amountPaid || 0)}</p>
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
                      <Input id="final-weight" name="finalWeight" type="number" step="any" value={finalWeight} onChange={(e) => setFinalWeight(parseFloat(e.target.value) || 0)} />
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
                        <Input id="final-total-price" type="number" step="any" value={finalTotalPrice.toFixed(2)} readOnly className='font-bold' />
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
                          <Input id={`settlement-amount-${index}`} type="number" step="any" placeholder="المبلغ" value={payment?.amount || ''} onChange={(e) => handleSettlementPaymentChange(index, 'amount', Number(e.target.value))} />
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
                        {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format((settlementSale.amountPaid || 0) + settlementTotalPaid)}
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
                <Button type="button" variant="outline" onClick={() => settlementSale && handlePrint(settlementSale!.id, 'invoice')}>
                    <Printer className="mr-2 h-4 w-4" />
                    طباعة الفاتورة
                </Button>
                <div className='flex gap-2'>
                  <Button type="button" variant="secondary" onClick={() => setIsSettlementDialogOpen(false)}>إلغاء</Button>
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
