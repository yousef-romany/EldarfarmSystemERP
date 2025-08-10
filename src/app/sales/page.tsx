
'use client';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { livestock, sales, wallets } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { format } from 'date-fns';
import { useState } from 'react';
import type { Payment } from '@/lib/types';


export default function SalesPage() {
  const [payments, setPayments] = useState<Partial<Payment[]>>([{}]);

  const getAnimalTag = (animalId: string) => {
    return livestock.find((animal) => animal.id === animalId)?.tagId || 'N/A';
  };
  
  const handleAddPayment = () => {
    setPayments([...payments, {}]);
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };
  
  const totalPaid = payments.reduce((acc, p) => acc + (p?.amount || 0), 0);

  return (
    <>
      <PageHeader title="إدارة المبيعات" />
      <Tabs defaultValue="immediate" dir="rtl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deferred">بيع آجل</TabsTrigger>
          <TabsTrigger value="immediate">بيع فوري</TabsTrigger>
        </TabsList>
        <TabsContent value="deferred">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>عمليات البيع الآجل</CardTitle>
                  <CardDescription>
                    إدارة عمليات البيع التي يتم فيها دفع جزء من المبلغ مقدماً.
                  </CardDescription>
                </div>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  بدء عملية بيع آجل
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العميل</TableHead>
                    <TableHead>الحيوان</TableHead>
                    <TableHead>تاريخ البيع</TableHead>
                    <TableHead>عربون (ج.م)</TableHead>
                    <TableHead>الوزن الأولي (كجم)</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>
                      <span className="sr-only">الإجراءات</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales
                    .filter((sale) => sale.type === 'Deferred')
                    .map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.customerName}</TableCell>
                        <TableCell>{getAnimalTag(sale.animalId)}</TableCell>
                        <TableCell>{format(new Date(sale.saleDate), 'yyyy-MM-dd')}</TableCell>
                        <TableCell>{sale.deposit?.toLocaleString()}</TableCell>
                        <TableCell>{sale.initialWeight}</TableCell>
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
                              <DropdownMenuItem>تحديث الوزن و إتمام البيع</DropdownMenuItem>
                              <DropdownMenuItem>عرض التفاصيل</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                إلغاء العملية
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="immediate">
          <Card>
            <CardHeader>
              <CardTitle>تسجيل عملية بيع فوري</CardTitle>
              <CardDescription>
                لتسجيل عملية بيع تمت بشكل فوري ومباشر.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="animal-select">اختر الحيوان</Label>
                  <Select>
                    <SelectTrigger id="animal-select">
                      <SelectValue placeholder="اختر حيوانًا من المتاحين..." />
                    </SelectTrigger>
                    <SelectContent>
                      {livestock
                        .filter((a) => a.status === 'Available')
                        .map((animal) => (
                          <SelectItem key={animal.id} value={animal.id}>
                            {animal.tagId} - {animal.type === 'Cow' ? 'بقرة' : 'خروف'} - {animal.weight} كجم
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customer-name">اسم العميل</Label>
                  <Input id="customer-name" placeholder="اسم المشتري" />
                </div>
              </div>
              
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
                          <Select>
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
                          <Input id={`amount-${index}`} type="number" placeholder="المبلغ" />
                        </div>
                        <Button
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
                  <Button variant="outline" size="sm" onClick={handleAddPayment}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    إضافة دفعة أخرى
                  </Button>
                  <div className='flex justify-between items-center p-3 bg-muted rounded-md'>
                      <span className='font-semibold'>الإجمالي المدفوع:</span>
                      <span className='font-bold text-lg'>
                        {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(totalPaid)}
                      </span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button>تسجيل البيع</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

