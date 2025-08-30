
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface SettlementDetail {
  name: string;
  balance: number;
}

interface Settlement {
  id: string;
  createdAt: string;
  amount: number;
  details: SettlementDetail[];
  settledBy: {
    username: string;
  };
}

export default function SettlementHistoryPage() {
  const { data: settlements, error, isLoading } = useSWR<Settlement[]>('/api/settlements', fetcher);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);

  const handleViewDetails = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setIsDetailsOpen(true);
  };
  
  if (isLoading) return <div>جاري تحميل سجل التسويات...</div>;
  if (error) return <div>فشل في تحميل البيانات.</div>;

  return (
    <>
      <PageHeader title="سجل التسويات المالية" />
      <Card>
        <CardHeader>
          <CardTitle>أرشيف التسويات</CardTitle>
          <CardDescription>قائمة بجميع عمليات التسوية اليومية التي تمت في النظام.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>تاريخ ووقت التسوية</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>المبلغ المسوى</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements && settlements.length > 0 ? (
                settlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell>{format(new Date(settlement.createdAt), 'yyyy-MM-dd, hh:mm a')}</TableCell>
                    <TableCell>{settlement.settledBy.username}</TableCell>
                    <TableCell className="font-bold">{formatCurrency(settlement.amount)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(settlement)}>
                        <Eye className="mr-2 h-4 w-4" />
                        عرض التفاصيل
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    لم تتم أي عمليات تسوية بعد.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تفاصيل التسوية</DialogTitle>
            <DialogDescription>
              عرض لأرصدة المحافظ في وقت التسوية بتاريخ {selectedSettlement && format(new Date(selectedSettlement.createdAt), 'yyyy-MM-dd hh:mm a')}
            </DialogDescription>
          </DialogHeader>
          {selectedSettlement && (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المحفظة</TableHead>
                    <TableHead className="text-right">الرصيد وقتها</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSettlement.details.map((detail, index) => (
                    <TableRow key={index}>
                      <TableCell>{detail.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(detail.balance)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted">
                    <TableCell>الإجمالي</TableCell>
                    <TableCell className="text-right">{formatCurrency(selectedSettlement.amount)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                إغلاق
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
