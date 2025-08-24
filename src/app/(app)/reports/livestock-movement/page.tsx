
'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Download, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import useSWR from 'swr';
import { Badge } from '@/components/ui/badge';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface MovementItem {
    source: 'شراء' | 'نذر' | 'بيع';
    tagId: string | null;
    isBatch: boolean;
    quantity: number | null;
    type: string;
    details: string;
}

interface LivestockMovementData {
  entries: MovementItem[];
  exits: MovementItem[];
}

export default function LivestockMovementReportPage() {
  const [date, setDate] = useState<Date>(new Date());
  
  const dateString = format(date, 'yyyy-MM-dd');
  const { data, error, isLoading } = useSWR<LivestockMovementData>(`/api/reports/livestock-movement?date=${dateString}`, fetcher);

  const getIdentifier = (item: MovementItem) => {
    return item.isBatch ? `${item.quantity} رأس` : item.tagId || 'N/A';
  }

  if (error) return <div>فشل في تحميل البيانات...</div>
  if (isLoading) return <div>جاري تحميل التقرير...</div>
  if (!data) return <div>لا توجد بيانات لهذا اليوم.</div>
  
  const { entries, exits } = data;

  return (
    <>
      <PageHeader
        title="التقرير اليومي لحركة المواشي"
        action={
            <div className="flex gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-[280px] justify-start text-left font-normal"
                    >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>اختر تاريخًا</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => d && setDate(d)}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                 <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">تنزيل</span>
                </Button>
            </div>
        }
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
                <ArrowDownCircle className="h-6 w-6 text-green-500" />
                <CardTitle>حيوانات دخلت المخزون</CardTitle>
            </div>
            <CardDescription>جميع الحيوانات التي تم شراؤها أو استلامها كنذر في هذا اليوم.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المصدر</TableHead>
                  <TableHead>الرقم التعريفي / الكمية</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>المورد / الناذر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((item, i) => (
                  <TableRow key={`in-${i}`}>
                    <TableCell>
                        <Badge variant={item.source === 'شراء' ? 'secondary' : 'default'}>{item.source}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{getIdentifier(item)}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.details}</TableCell>
                  </TableRow>
                ))}
                {entries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">لم تدخل أي حيوانات للمخزون في هذا اليوم.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-6 w-6 text-red-500" />
                <CardTitle>حيوانات خرجت من المخزون</CardTitle>
            </div>
            <CardDescription>جميع الحيوانات التي تم بيعها وتسليمها في هذا اليوم.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>المصدر</TableHead>
                    <TableHead>الرقم التعريفي</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>العميل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exits.map((item, i) => (
                  <TableRow key={`out-${i}`}>
                    <TableCell>
                         <Badge variant={'destructive'}>{item.source}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{getIdentifier(item)}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.details}</TableCell>
                  </TableRow>
                ))}
                {exits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">لم تخرج أي حيوانات من المخزون في هذا اليوم.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
