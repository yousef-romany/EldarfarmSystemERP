
'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { vows, livestock } from '@/lib/data';
import type { Vow, Livestock as LivestockType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Beef, Printer, Gift } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const VowReceiptPage = () => {
  const params = useParams();
  const { id } = params;
  const [vow, setVow] = useState<Vow | null>(null);
  const [animal, setAnimal] = useState<LivestockType | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vowData = vows.find((s) => s.id === id);
    if (vowData) {
      setVow(vowData);
      const animalData = livestock.find((l) => l.id === vowData.livestockId);
      setAnimal(animalData || null);
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const getAnimalType = (animal: LivestockType) => {
    if (animal.isBatch) {
      switch (animal.type) {
        case 'Chicken': return 'دفعة دجاج';
        case 'Sheep': return 'دفعة غنم';
        case 'Goat': return 'دفعة ماعز';
        default: return `دفعة ${animal.type}`;
      }
    }
    switch (animal.type) {
      case 'Cow': return 'بقرة';
      case 'Sheep': return 'خروف';
      case 'Goat': return 'ماعز';
      case 'Chicken': return 'دجاج';
      default: return animal.type;
    }
  }

  if (!vow || !animal) {
    return <div>جاري تحميل الإيصال...</div>;
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
                            <Gift className="h-12 w-12 text-primary" />
                            <div>
                                <h1 className="text-2xl font-bold">دير مار جرجس بالرزيقات</h1>
                                <p className="text-muted-foreground">إيصال استلام نذر</p>
                            </div>
                        </div>
                        <div className="text-left">
                            <p><strong>إيصال رقم:</strong> {vow.receiptId}</p>
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
                            <TableCell>{animal.weight} {animal.isBatch && <span className="text-xs text-muted-foreground">(متوسط)</span>}</TableCell>
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

export default VowReceiptPage;

