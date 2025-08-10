import { PlusCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { expenses } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import type { Expense } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ExpensesPage() {
  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);

  const getCategoryText = (category: Expense['category']) => {
    switch (category) {
      case 'Feed': return 'علف';
      case 'Vet': return 'بيطري';
      case 'Maintenance': return 'صيانة';
      case 'Other': return 'أخرى';
    }
  }

  const getCategoryVariant = (category: Expense['category']) => {
    switch (category) {
      case 'Feed': return 'default';
      case 'Vet': return 'destructive';
      case 'Maintenance': return 'secondary';
      case 'Other': return 'outline';
    }
  }


  return (
    <>
      <PageHeader
        title="إدارة المصروفات"
        action={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            إضافة مصروف
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(totalExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <h3 className="text-lg font-semibold">سجل المصروفات</h3>
            <div className="ml-auto flex items-center gap-2">
              <Select>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="فلترة بالنوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="Feed">علف</SelectItem>
                  <SelectItem value="Vet">بيطري</SelectItem>
                  <SelectItem value="Maintenance">صيانة</SelectItem>
                  <SelectItem value="Other">أخرى</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-[280px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>اختر نطاق زمني</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="range" numberOfMonths={2} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead className="text-left">المبلغ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{format(new Date(expense.date), 'yyyy-MM-dd')}</TableCell>
                  <TableCell>
                    <Badge variant={getCategoryVariant(expense.category)}>{getCategoryText(expense.category)}</Badge>
                  </TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell className="text-left font-medium">
                    {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(expense.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
