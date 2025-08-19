import { PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { livestock, barns } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import type { Livestock } from '@/lib/types';

export default function LivestockPage() {
  const getBarnName = (barnId: string) => {
    return barns.find((b) => b.id === barnId)?.name || 'غير محدد';
  };

  const getStatusVariant = (status: 'Available' | 'Sold' | 'Quarantined') => {
    switch (status) {
      case 'Available':
        return 'default';
      case 'Sold':
        return 'destructive';
      case 'Quarantined':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: 'Available' | 'Sold' | 'Quarantined') => {
    switch (status) {
      case 'Available':
        return 'متاح';
      case 'Sold':
        return 'مباع';
      case 'Quarantined':
        return 'في الحجر';
      default:
        return status;
    }
  }
  
  const getTypeText = (animal: Livestock) => {
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


  return (
    <>
      <PageHeader
        title="نظرة عامة على المواشي"
        action={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            إضافة حيوان
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث بالرقم التعريفي..." className="pl-8" />
            </div>
            <div className="flex gap-4">
              <Select>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="فلترة بالنوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="cow">أبقار</SelectItem>
                  <SelectItem value="sheep">أغنام</SelectItem>
                  <SelectItem value="goat">ماعز</SelectItem>
                  <SelectItem value="chicken">دواجن</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="فلترة بالعنبر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {barns.map((barn) => (
                    <SelectItem key={barn.id} value={barn.id}>
                      {barn.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرقم التعريفي / الكمية</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>السلالة</TableHead>
                <TableHead>الوزن (كجم)</TableHead>
                <TableHead>العمر (أشهر)</TableHead>
                <TableHead>العنبر</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {livestock.map((animal) => (
                <TableRow key={animal.id}>
                  <TableCell className="font-medium">
                    {animal.isBatch ? `${animal.quantity} رأس` : animal.tagId}
                  </TableCell>
                  <TableCell>{getTypeText(animal)}</TableCell>
                  <TableCell>{animal.breed}</TableCell>
                  <TableCell>{animal.weight} {animal.isBatch && <span className="text-xs text-muted-foreground">(متوسط)</span>}</TableCell>
                  <TableCell>{animal.age}</TableCell>
                  <TableCell>{getBarnName(animal.barnId)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(animal.status)}>{getStatusText(animal.status)}</Badge>
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
