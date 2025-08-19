
'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Printer, Coins } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Contribution, Payment, Wallet } from '@prisma/client';
import { getContributionById } from '@/lib/actions/contribution.actions';

type ContributionWithDetails = Contribution & {
    payments: (Payment & { wallet: Wallet })[];
};

const ContributionReceiptPage = () => {
  const params = useParams();
  const { id } = params;
  const [contribution, setContribution] = useState<ContributionWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof id === 'string') {
        setIsLoading(true);
        getContributionById(id).then(data => {
            if (data) {
                setContribution(data as ContributionWithDetails);
            }
            setIsLoading(false);
        });
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const getWalletName = (walletId: string) => contribution?.payments.find(p => p.walletId === walletId)?.wallet.name || 'N/A';

  const totalPaid = contribution?.payments.reduce((acc, p) => acc + p.amount.toNumber(), 0) || 0;
  
  if (isLoading) {
    return <div>جاري تحميل الإيصال...</div>;
  }
  
  if (!contribution) {
    return <div>لم يتم العثور على الإيصال.</div>;
  }
  
  return (
    <div className="bg-gray-100 dark:bg-gray-800 min-h-screen p-4 sm:p-8 flex flex-col items-center font-body">
        <div className="w-full max-w-4xl space-y-4">
            <div className="flex justify-end gap-2 no-print">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    طباعة
                </Button>
            </div>

            <Card ref={receiptRef} className="p-6 sm:p-8 print-friendly">
                <CardHeader className="p-0">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <Coins className="h-12 w-12 text-primary" />
                            <div>
                                <h1 className="text-2xl font-bold">دير مار جرجس بالرزيقات</h1>
                                <p className="text-muted-foreground">إيصال استلام مساهمة نقدية</p>
                            </div>
                        </div>
                        <div className="text-left">
                            <p><strong>إيصال رقم:</strong> {contribution.id.substring(0,8)}</p>
                            <p><strong>تاريخ الاستلام:</strong> {format(new Date(contribution.date), 'yyyy-MM-dd')}</p>
                        </div>
                    </div>
                    <Separator className="my-6" />
                    <div>
                        <h3 className="font-semibold mb-2">بيانات المساهم:</h3>
                        <p>{contribution.donorName}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0 mt-6">
                    <h3 className="font-semibold text-lg mb-2">تفاصيل المساهمة</h3>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الوصف</TableHead>
                                <TableHead className="text-right">المبلغ الإجمالي (ج.م)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>{contribution.description}</TableCell>
                                <TableCell className="text-right font-bold">{contribution.totalAmount.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    
                    <h3 className="font-semibold text-lg mb-2 mt-6">تفاصيل الدفع</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>المحفظة / الحساب</TableHead>
                                <TableHead className="text-right">المبلغ (ج.م)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contribution.payments.map((p, i) => (
                                <TableRow key={i}>
                                    <TableCell>{p.wallet.name}</TableCell>
                                    <TableCell className="text-right">{p.amount.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                             ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="p-0 mt-6 flex flex-col items-end space-y-2">
                     <Separator className="my-4" />
                     <div className="flex justify-between w-full font-bold text-lg">
                        <span>الإجمالي المدفوع:</span>
                        <span>{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م</span>
                     </div>
                </CardFooter>
                 <div className="mt-8 text-center text-xs text-muted-foreground">
                    <p>شكرًا لمساهمتكم ودعمكم للدير.</p>
                    <p>بركة وشفاعة أمير الشهداء مار جرجس تكون معكم. آمين.</p>
                    <p className="mt-4 font-bold">دير مار جرجس بالرزيقات - {new Date().getFullYear()}</p>
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

export default ContributionReceiptPage;
