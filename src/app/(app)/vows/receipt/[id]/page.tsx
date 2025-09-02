
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Gift, Printer } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Vow, Livestock, LivestockType } from '@prisma/client';
import { getVowById } from '@/lib/actions/vow.actions';
import { notFound } from 'next/navigation';
import { PrintButton } from './print-button';

type VowWithDetails = Vow & {
    livestock: Livestock & {
        livestockType: LivestockType;
    };
};

type SerializedVow = Omit<VowWithDetails, 'livestock'> & {
    livestock: Omit<VowWithDetails['livestock'], 'weight' | 'cost'> & {
        weight: number;
        cost: number;
    }
}


export default async function VowReceiptPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  if (!id) {
      notFound();
  }

  const vow = await getVowById(id) as SerializedVow;

  if (!vow) {
    notFound();
  }
  
  const getAnimalType = (animal: SerializedVow['livestock']) => {
    if (animal.isBatch) {
      return `دفعة ${animal.livestockType.name}`;
    }
    return animal.livestockType.name;
  }
  
  const animal = vow.livestock;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 min-h-screen p-4 sm:p-8 flex flex-col items-center font-body printable-area">
        <div className="w-full max-w-4xl space-y-4 no-print">
           <PrintButton />
        </div>

        <Card className="p-6 sm:p-8 print-friendly w-full max-w-4xl">
            <CardHeader className="p-0">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Gift className="h-12 w-12 text-primary" />
                        <div>
                            <h1 className="text-2xl font-bold">دير مار جرجس بالرزيقات</h1>
                            <p className="text-muted-foreground">إيصال استلام نذر</p>
                        </div>
                    </div>
                    <div className="text-left">
                        <p><strong>إيصال رقم:</strong> {vow.receiptId || vow.id}</p>
                        <p><strong>تاريخ الاستلام:</strong> {format(new Date(vow.date), 'yyyy-MM-dd')}</p>
                    </div>
                </div>
                <Separator className="my-6" />
                <div>
                    <h3 className="font-semibold mb-2">بيانات الناذر:</h3>
                    <p>{vow.donorName}</p>
                </div>
            </CardHeader>
            <CardContent className="p-0 mt-6">
                <h3 className="font-semibold text-lg mb-2">تفاصيل النذر</h3>
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>البيان</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>الوزن (كجم)</TableHead>
                        <TableHead>العمر (أشهر)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                        <TableCell>{animal.isBatch ? `${animal.quantity} رأس` : animal.tagId || 'بدون رقم'}</TableCell>
                        <TableCell>{getAnimalType(animal)}</TableCell>
                        <TableCell>{animal.weight.toFixed(2)} {animal.isBatch && <span className="text-xs text-muted-foreground">(متوسط)</span>}</TableCell>
                        <TableCell>{animal.age}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                
                {vow.notes && (
                    <div className='mt-6'>
                        <h3 className="font-semibold text-lg mb-2">ملاحظات</h3>
                        <p className="text-sm text-muted-foreground border p-3 rounded-md">{vow.notes}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-0 mt-8 flex flex-col items-center space-y-2">
                 <Separator className="my-4" />
                 <div className="text-center text-xs text-muted-foreground">
                    <p>تُسلم هذه النسخة للناذر كإثبات على استلام الدير للنذر الموضح أعلاه.</p>
                    <p>بركة وشفاعة أمير الشهداء مار جرجس تكون معكم. آمين.</p>
                    <p className="mt-4 font-bold">دير مار جرجس بالرزيقات - {new Date().getFullYear()}</p>
                </div>
            </CardFooter>
        </Card>

        <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .printable-area, .printable-area * {
                visibility: visible;
              }
              .printable-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              .no-print {
                display: none !important;
              }
              .print-friendly {
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
              }
            }
        `}</style>
    </div>
  );
};
