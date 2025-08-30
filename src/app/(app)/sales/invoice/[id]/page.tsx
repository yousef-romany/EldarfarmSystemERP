
'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Beef, Printer } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSaleById } from '@/lib/actions/sale.actions';
import type { Sale, Livestock, LivestockType, Wallet, Payment } from '@prisma/client';


type SaleWithDetails = Sale & {
    livestock: Livestock & {
        livestockType: LivestockType;
    };
    payments: (Payment & { wallet: Wallet })[];
};

// This type represents the data after serialization (Decimal -> number)
type SerializedSale = Omit<SaleWithDetails, 'pricePerKg' | 'totalPrice' | 'amountPaid' | 'remainingAmount' | 'initialWeight' | 'finalWeight' | 'livestock' | 'payments'> & {
    pricePerKg: number;
    totalPrice: number;
    amountPaid: number;
    remainingAmount: number;
    initialWeight: number | null;
    finalWeight: number | null;
    livestock: Omit<Livestock, 'weight' | 'cost'> & { weight: number, cost: number, livestockType: LivestockType };
    payments: (Omit<Payment, 'amount'> & { amount: number, wallet: Omit<Wallet, 'balance'> & { balance: number } })[];
};


const InvoicePage = () => {
  const params = useParams();
  const { id } = params;
  const [sale, setSale] = useState<SerializedSale | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof id === 'string') {
        setIsLoading(true);
        getSaleById(id).then(data => {
            if (data) {
                setSale(data as SerializedSale);
            }
            setIsLoading(false);
        });
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };
  
  const totalPaid = sale?.amountPaid || 0;
  const finalPrice = sale?.totalPrice || 0;
  const remainingBalance = finalPrice - totalPaid;

  if (isLoading) {
    return <div>جاري تحميل الفاتورة...</div>;
  }
  
  if (!sale) {
    return <div>لم يتم العثور على الفاتورة.</div>;
  }

  const animal = sale.livestock;
  const isImmediateSale = sale.type === 'Immediate';


  return (
    <div className="bg-gray-100 dark:bg-gray-800 min-h-screen p-4 sm:p-8 flex flex-col items-center font-body">
        <div className="w-full max-w-4xl space-y-4">
            <div className="flex justify-end gap-2 no-print">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    طباعة
                </Button>
            </div>

            <Card ref={invoiceRef} className="p-6 sm:p-8 print-friendly">
                <CardHeader className="p-0">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <Beef className="h-12 w-12 text-primary" />
                            <div>
                                <h1 className="text-2xl font-bold">مدير المواشي</h1>
                                <p className="text-muted-foreground">{isImmediateSale ? 'فاتورة بيع فوري (POS)' : 'فاتورة بيع آجل'}</p>
                            </div>
                        </div>
                        <div className="text-left">
                            <p><strong>فاتورة رقم:</strong> {sale.id.substring(0,8)}</p>
                            <p><strong>تاريخ البيع:</strong> {format(new Date(sale.saleDate), 'yyyy-MM-dd')}</p>
                            {sale.settlementDate && <p><strong>تاريخ التسوية:</strong> {format(new Date(sale.settlementDate), 'yyyy-MM-dd')}</p>}
                        </div>
                    </div>
                    <Separator className="my-6" />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold mb-2">بيانات العميل:</h3>
                            <p>{sale.customerName}</p>
                        </div>
                        <div className='text-left'>
                            <h3 className="font-semibold mb-2">بيانات البائع:</h3>
                            <p>مزرعة المواشي الحديثة</p>
                            <p>contact@mawashi.com</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 mt-6">
                    <h3 className="font-semibold text-lg mb-2">تفاصيل الحيوان</h3>
                     <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>الرقم التعريفي</TableHead>
                            <TableHead>النوع</TableHead>
                            <TableHead>السلالة</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                            <TableCell>{animal.tagId}</TableCell>
                            <TableCell>{animal.livestockType.name}</TableCell>
                            <TableCell>{animal.breed}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    
                    <h3 className="font-semibold text-lg mb-2 mt-6">تفاصيل الوزن والسعر</h3>
                    {isImmediateSale ? (
                         <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell>الوزن عند البيع (كجم)</TableCell>
                                    <TableCell className="text-left font-bold">{sale.initialWeight?.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>سعر الكيلو (ج.م)</TableCell>
                                    <TableCell className="text-left font-bold">{sale.pricePerKg.toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                         </Table>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>الوصف</TableHead>
                                    <TableHead className="text-center">القيمة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>الوزن المبدئي (كجم)</TableCell>
                                    <TableCell className="text-center">{sale.initialWeight?.toFixed(2)}</TableCell>
                                </TableRow>
                                {sale.finalWeight && (
                                    <>
                                    <TableRow>
                                        <TableCell>الوزن النهائي (كجم)</TableCell>
                                        <TableCell className="text-center">{sale.finalWeight?.toFixed(2)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>فرق الوزن (كجم)</TableCell>
                                        <TableCell className="text-center font-bold">{(sale.finalWeight - (sale.initialWeight || 0)).toFixed(2)}</TableCell>
                                    </TableRow>
                                    </>
                                )}
                                <TableRow>
                                    <TableCell>سعر الكيلو (ج.م)</TableCell>
                                    <TableCell className="text-center">{sale.pricePerKg.toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    )}

                     <h3 className="font-semibold text-lg mb-2 mt-6">تفاصيل الدفعات</h3>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>الوصف</TableHead>
                                <TableHead className="text-right">المبلغ (ج.م)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {sale.payments?.map((p, i) => (
                                <TableRow key={i}>
                                     <TableCell>{p.date ? format(new Date(p.date), 'yyyy-MM-dd') : '-'}</TableCell>
                                     <TableCell>دفعة من {p.wallet.name}</TableCell>
                                     <TableCell className="text-right">{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                             ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="p-0 mt-6 flex flex-col items-end space-y-2">
                     <Separator className="my-4" />
                      <div className="flex justify-between w-full font-semibold text-lg">
                        <span>السعر الإجمالي:</span>
                        <span>{finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م</span>
                     </div>
                     <div className="flex justify-between w-full font-semibold">
                        <span>الإجمالي المدفوع:</span>
                        <span>{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م</span>
                     </div>
                      <div className="flex justify-between w-full font-bold text-lg text-destructive">
                        <span>المبلغ المتبقي:</span>
                        <span>{remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م</span>
                     </div>
                </CardFooter>
                 <div className="mt-8 text-center text-xs text-muted-foreground">
                    <p>شكرًا لتعاملكم معنا!</p>
                    <p>مزرعة المواشي الحديثة - جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
                </div>
            </Card>
        </div>

        <style jsx global>{`
            @media print {
            body {
                background-color: #fff !important;
            }
            .no-print {
                display: none;
            }
            .print-friendly {
                box-shadow: none;
                border: none;
            }
            }
        `}</style>
    </div>
  );
};

export default InvoicePage;
