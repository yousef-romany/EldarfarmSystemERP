
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Livestock, LivestockType, Barn } from '@prisma/client';
import useSWR from 'swr';

type LivestockWithDetails = Livestock & {
  barn: Barn;
  livestockType: LivestockType;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [barnFilter, setBarnFilter] = useState(searchParams.get('barn') || 'all');
  
  const { data: barns, error: barnsError } = useSWR<Barn[]>('/api/barns', fetcher);
  const { data: livestockTypes, error: typesError } = useSWR<LivestockType[]>('/api/livestock-types', fetcher);

  const createQueryString = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (barnFilter !== 'all') params.set('barn', barnFilter);
    return params.toString();
  };

  const { data: livestock, error: livestockError, isLoading } = useSWR<LivestockWithDetails[]>(`/api/livestock?${createQueryString()}`, fetcher);


  const handleFilterChange = (type: 'search' | 'type' | 'barn', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(type, value);
    } else {
      params.delete(type);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const getStatusVariant = (status: Livestock['status']) => {
    switch (status) {
      case 'Available': return 'default';
      case 'Sold': return 'destructive';
      case 'Quarantined': return 'secondary';
      case 'Vowed': return 'secondary';
      case 'PendingSale': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusText = (status: Livestock['status']) => {
    switch (status) {
      case 'Available': return 'متاح';
      case 'Sold': return 'مباع';
      case 'Quarantined': return 'في الحجر';
      case 'Vowed': return 'نذر';
      case 'PendingSale': return 'بيع آجل';
      default: return status;
    }
  };
  
  const getTypeText = (animal: LivestockWithDetails) => {
    if (animal.isBatch) {
      return `دفعة ${animal.livestockType.name}`;
    }
    return animal.livestockType.name;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="بحث بالرقم التعريفي..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilterChange('search', searchTerm)}
              />
            </div>
            <div className="flex gap-4">
              <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); handleFilterChange('type', value); }}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="فلترة بالنوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {livestockTypes?.map(type => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={barnFilter} onValueChange={(value) => { setBarnFilter(value); handleFilterChange('barn', value); }}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="فلترة بالعنبر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {barns?.map((barn) => (
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
              {isLoading && <TableRow><TableCell colSpan={7} className="text-center">جاري التحميل...</TableCell></TableRow>}
              {livestockError && <TableRow><TableCell colSpan={7} className="text-center text-destructive">فشل في تحميل البيانات.</TableCell></TableRow>}
              {livestock && livestock.map((animal) => (
                <TableRow key={animal.id}>
                  <TableCell className="font-medium">
                    {animal.isBatch ? `${animal.quantity} رأس` : animal.tagId}
                  </TableCell>
                  <TableCell>{getTypeText(animal)}</TableCell>
                  <TableCell>{animal.breed}</TableCell>
                  <TableCell>{animal.weight.toNumber()} {animal.isBatch && <span className="text-xs text-muted-foreground">(متوسط)</span>}</TableCell>
                  <TableCell>{animal.age}</TableCell>
                  <TableCell>{animal.barn.name}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(animal.status)}>{getStatusText(animal.status)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {livestock?.length === 0 && !isLoading && (
                 <TableRow><TableCell colSpan={7} className="text-center">لا توجد نتائج مطابقة للبحث.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
