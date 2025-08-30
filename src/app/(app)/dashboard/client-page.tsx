
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BarChart, Package, Users, Warehouse, DollarSign, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Livestock, LivestockStatus, LivestockType, Barn } from '@prisma/client';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell } from "recharts"
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useSWR from 'swr';

type DashboardStats = {
  livestockCount: number;
  barnCount: number;
  totalValue: number;
  statusCounts: Record<LivestockStatus, number>;
  typeCounts: { name: string, count: number }[];
};

type LivestockWithDetails = Omit<Livestock, 'weight' | 'cost'> & {
  weight: number;
  cost: number;
  barn: Barn;
  livestockType: LivestockType;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardClientPage({ stats }: { stats: DashboardStats }) {
  // SWR and state for the filterable list
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [barnFilter, setBarnFilter] = useState(searchParams.get('barn') || 'all');
  
  const { data: barns, error: barnsError } = useSWR<Barn[]>('/api/barns', fetcher);
  const { data: livestockTypes, error: typesError } = useSWR<LivestockType[]>('/api/livestock-types', fetcher);
  
  const createQueryString = () => {
    const params = new URLSearchParams(searchParams.toString());
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

  // Helper functions for rendering
  const getStatusText = (status: string) => {
    switch (status) {
      case 'Available': return 'متاح';
      case 'Sold': return 'مباع';
      case 'Quarantined': return 'في الحجر';
      case 'Vowed': return 'نذر';
      case 'PendingSale': return 'بيع آجل';
      default: return status;
    }
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
  
  const getTypeText = (animal: LivestockWithDetails) => {
    if (animal.isBatch) {
      return `دفعة ${animal.livestockType.name}`;
    }
    return animal.livestockType.name;
  };
  
  // Chart configuration
  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
  const chartConfig = stats.typeCounts.reduce((acc, type, index) => {
      acc[type.name] = {
        label: type.name,
        color: COLORS[index % COLORS.length]
      };
      return acc;
  }, {} as any);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المواشي الحية</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.livestockCount} رأس</div>
            <p className="text-xs text-muted-foreground">في جميع العنابر</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيمة المخزون التقديرية</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">تكلفة المواشي المتاحة حاليًا</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العنابر النشطة</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.barnCount}</div>
            <p className="text-xs text-muted-foreground">إجمالي العنابر المسجلة</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مواشٍ قيد البيع</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.statusCounts.PendingSale || 0}</div>
            <p className="text-xs text-muted-foreground">عمليات بيع آجلة لم تتم تسويتها</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>المواشي حسب النوع</CardTitle>
            <CardDescription>توزيع أعداد المواشي الحية حسب النوع.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
             <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px] w-full">
                <PieChart>
                    <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                    data={stats.typeCounts}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                    >
                    {stats.typeCounts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color} />
                    ))}
                    </Pie>
                </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>ملخص حالة المواشي</CardTitle>
             <CardDescription>عرض سريع لأعداد المواشي في كل حالة.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>الحالة</TableHead>
                        <TableHead className="text-center">العدد</TableHead>
                    </TableRow>
                </TableHeader>
                 <TableBody>
                    {Object.entries(stats.statusCounts).map(([status, count]) => (
                        <TableRow key={status}>
                            <TableCell className="font-medium">{getStatusText(status)}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant="secondary">{count}</Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة جميع المواشي</CardTitle>
          <CardDescription>بحث وفلترة جميع المواشي المسجلة في النظام.</CardDescription>
          <div className="flex flex-col gap-4 pt-4 md:flex-row md:items-center">
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
                  <TableCell>{animal.weight} {animal.isBatch && <span className="text-xs text-muted-foreground">(متوسط)</span>}</TableCell>
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
    </div>
  );
}
