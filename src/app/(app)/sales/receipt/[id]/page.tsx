'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
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


const POSReceiptPage = () => {
  const params = useParams();
  const { id } = params;
  const [sale, setSale] = useState<SerializedSale | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const receiptRef = useRef<HTMLDivElement>(null);

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
    return <div className="p-4">جاري تحميل الإيصال...</div>;
  }
  
  if (!sale) {
    return <div className="p-4">لم يتم العثور على الإيصال.</div>;
  }

  const animal = sale.livestock;
  const weight = sale.finalWeight || sale.initialWeight;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 min-h-screen p-4 flex justify-center font-mono">
        <div className="w-full max-w-xs space-y-4">
            <div className="flex justify-end gap-2 no-print">
                <Button onClick={handlePrint} size="sm">
                    <Printer className="mr-2 h-4 w-4" />
                    طباعة
                </Button>
            </div>

            <div ref={receiptRef} className="p-3 bg-white text-black shadow-md print-friendly">
                <div className="text-center">
                    <h2 className="text-lg font-bold">مدير المواشي</h2>
                    <p className="text-xs">دير مار جرجس بالرزيقات</p>
                    <p className="text-xs">{format(new Date(), "yyyy-MM-dd hh:mm a")}</p>
                </div>

                <Separator className="my-2 border-dashed border-black" />

                <div className="text-xs space-y-1">
                    <p>العميل: {sale.customerName}</p>
                    <p>الفاتورة #: {sale.id.substring(0, 8)}</p>
                </div>

                <Separator className="my-2 border-dashed border-black" />

                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-dashed border-black">
                            <th className="text-right pb-1">الصنف</th>
                            <th className="text-center pb-1">الكمية</th>
                            <th className="text-left pb-1">السعر</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="pt-1">{animal.livestockType.name} - {animal.breed}</td>
                            <td className="text-center pt-1">1</td>
                            <td className="text-left pt-1">{finalPrice.toFixed(2)}</td>
                        </tr>
                        <tr className="text-muted-foreground">
                            <td colSpan={3} className="text-right text-xs">الرقم: {animal.tagId}, الوزن: {weight?.toFixed(2)} كجم @ {sale.pricePerKg.toFixed(2)}/كجم</td>
                        </tr>
                    </tbody>
                </table>
                
                <Separator className="my-2 border-dashed border-black" />

                <div className="text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                        <span>الإجمالي:</span>
                        <span>{finalPrice.toFixed(2)} ج.م</span>
                    </div>
                     <div className="flex justify-between">
                        <span>المدفوع:</span>
                        <span>{totalPaid.toFixed(2)} ج.م</span>
                    </div>
                    {remainingBalance > 0 && (
                        <div className="flex justify-between font-bold">
                            <span>المتبقي:</span>
                            <span>{remainingBalance.toFixed(2)} ج.م</span>
                        </div>
                    )}
                </div>

                <Separator className="my-2 border-dashed border-black" />

                <div className="text-center text-xs mt-3">
                    <p>شكراً لتعاملكم معنا!</p>
                </div>
            </div>
        </div>

        <style jsx global>{`
            @media print {
              @page {
                size: 80mm auto; /* Adjust width as needed for your printer */
                margin: 0;
              }
              body {
                background-color: #fff !important;
                -webkit-print-color-adjust: exact;
              }
              .no-print {
                display: none;
              }
              .print-friendly {
                box-shadow: none;
                border: none;
                width: 100%;
                max-width: 100%;
                padding: 0;
                margin: 0;
              }
            }
        `}</style>
    </div>
  );
};

export default POSReceiptPage;
