
'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { sales, livestock, wallets, users } from '@/lib/data';
import type { Sale, Livestock as LivestockType, Wallet } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Beef, Printer } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const InvoicePage = () => {
  const params = useParams();
  const { id } = params;
  const [sale, setSale] = useState<Sale | null>(null);
  const [animal, setAnimal] = useState<LivestockType | null>(null);

  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saleData = sales.find((s) => s.id === id);
    if (saleData) {
      setSale(saleData);
      const animalData = livestock.find((l) => l.id === saleData.animalId);
      setAnimal(animalData || null);
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const getWalletName = (walletId: string) => wallets.find(w => w.id === walletId)?.name || 'N/A';
  const getAnimalType = (type: LivestockType['type']) => {
    switch (type) {
        case 'Cow': return 'بقرة';
        case 'Sheep': return 'خروف';
        case 'Goat': 'ماعز';
    }
  }

  const allPayments = [
      ...(sale?.deposit ? [{amount: sale.deposit, walletId: 'deposit', date: sale.saleDate}] : []),
      ...(sale?.payments || [])
  ];

  const totalPaid = allPayments.reduce((acc, p) => acc + p.amount, 0);
  const remainingBalance = sale ? sale.totalPrice - totalPaid : 0;


  if (!sale || !animal) {
    return <div>جاري تحميل الفاتورة...</div>;
  }
  
  const isSettled = sale.status === 'Completed';
  const finalPrice = isSettled && sale.finalWeight ? sale.finalWeight * sale.pricePerKg : sale.totalPrice;


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
                                <p className="text-muted-foreground">فاتورة بيع</p>
                            </div>
                        </div>
                        <div className="text-left">
                            <p><strong>فاتورة رقم:</strong> {sale.id}</p>
                            <p><strong>تاريخ الاتفاق:</strong> {format(new Date(sale.saleDate), 'yyyy-MM-dd')}</p>
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
                            <TableCell>{getAnimalType(animal.type)}</TableCell>
                            <TableCell>{animal.breed}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    
                    <h3 className="font-semibold text-lg mb-2 mt-6">تفاصيل الوزن والسعر</h3>
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
                             {isSettled && sale.finalWeight && (
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
                             <TableRow className="bg-muted font-bold">
                                <TableCell>السعر الإجمالي (ج.م)</TableCell>
                                <TableCell className="text-center text-lg">{finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>

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
                             {sale.deposit && (
                                <TableRow>
                                    <TableCell>{format(new Date(sale.saleDate), 'yyyy-MM-dd')}</TableCell>
                                    <TableCell>عربون</TableCell>
                                    <TableCell className="text-right">{sale.deposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                             )}
                             {sale.payments?.map((p, i) => (
                                <TableRow key={i}>
                                     <TableCell>{p.date ? format(new Date(p.date), 'yyyy-MM-dd') : '-'}</TableCell>
                                     <TableCell>دفعة من {getWalletName(p.walletId)}</TableCell>
                                     <TableCell className="text-right">{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                             ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="p-0 mt-6 flex flex-col items-end space-y-2">
                     <Separator className="my-4" />
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
                background-color: #fff;
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
