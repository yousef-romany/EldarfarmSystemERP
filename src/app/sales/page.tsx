import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { livestock, sales } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { format } from 'date-fns';

export default function SalesPage() {
  const getAnimalTag = (animalId: string) => {
    return livestock.find((animal) => animal.id === animalId)?.tagId || 'N/A';
  };

  return (
    <>
      <PageHeader title="إدارة المبيعات" />
      <Tabs defaultValue="deferred" dir="rtl">
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
              <div className="grid gap-2">
                <Label htmlFor="sale-price">سعر البيع النهائي (ج.م)</Label>
                <Input id="sale-price" type="number" placeholder="المبلغ الإجمالي" />
              </div>
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
