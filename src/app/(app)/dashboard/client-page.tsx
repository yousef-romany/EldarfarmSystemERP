'use client';

import { useState, useEffect, useTransition, useMemo, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart,
  Package,
  Users,
  Warehouse,
  DollarSign,
  Search,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Receipt,
  Heart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Livestock, LivestockStatus, LivestockType, Barn } from '@prisma/client';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useSWR from 'swr';
import { useDebounce } from 'use-debounce';
import { formatDateArabic, formatCurrency } from '@/lib/utils';


type DashboardStats = {
  livestockCount: number;
  barnCount: number;
  totalValue: number;
  statusCounts: Record<LivestockStatus, number>;
  typeCounts: { name: string, count: number }[];
  sales: {
    allTime: { total: number; paid: number; remaining: number; count: number };
    thisMonth: { total: number; paid: number; remaining: number; count: number };
    today: { total: number; paid: number; remaining: number; count: number };
    yesterday: { total: number; count: number };
  };
  expenses: {
    allTime: { total: number; count: number };
    thisMonth: { total: number; count: number };
    today: { total: number; count: number };
    yesterday: { total: number; count: number };
  };
  purchases: {
    allTime: { total: number; count: number };
    thisMonth: { total: number; count: number };
  };
  contributions: {
    allTime: { total: number; count: number };
    thisMonth: { total: number; count: number };
  };
  vows: {
    allTime: { count: number };
    thisMonth: { count: number };
  };
  profit: {
    allTime: number;
    thisMonth: number;
    today: number;
  };
  dailyData: { date: string; sales: number; expenses: number; profit: number }[];
};

type LivestockWithDetails = Omit<Livestock, 'weight' | 'cost'> & {
  weight: number;
  cost: number;
  barn: Barn;
  livestockType: LivestockType;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardClientPage({ stats }: { stats: DashboardStats }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Initialize state from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [barnFilter, setBarnFilter] = useState(searchParams.get('barn') || 'all');
  
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const { data: barns, error: barnsError } = useSWR<Barn[]>('/api/barns', fetcher);
  const { data: livestockTypes, error: typesError } = useSWR<LivestockType[]>('/api/livestock-types', fetcher);
  
  // SWR will re-fetch whenever the key (URL query string) changes
  const queryString = new URLSearchParams({
      search: debouncedSearchTerm,
      type: typeFilter,
      barn: barnFilter
  }).toString();
  
  const { data: livestock, error: livestockError, isLoading } = useSWR<LivestockWithDetails[]>(`/api/livestock?${queryString}`, fetcher);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (debouncedSearchTerm) {
      params.set('search', debouncedSearchTerm);
    } else {
      params.delete('search');
    }
    if (typeFilter !== 'all') {
      params.set('type', typeFilter);
    } else {
      params.delete('type');
    }
    if (barnFilter !== 'all') {
      params.set('barn', barnFilter);
    } else {
      params.delete('barn');
    }
    startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
    });
  }, [debouncedSearchTerm, typeFilter, barnFilter, pathname, router]);
  
  // Helper functions for rendering - memoized for performance
  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'Available': return 'متاح';
      case 'Sold': return 'مباع';
      case 'Vowed': return 'نذر';
      case 'PendingSale': return 'بيع آجل';
      default: return status;
    }
  }, []);

  const getStatusVariant = useCallback((status: Livestock['status']) => {
    switch (status) {
      case 'Available': return 'default';
      case 'Sold': return 'destructive';
      case 'Vowed': return 'secondary';
      case 'PendingSale': return 'secondary';
      default: return 'outline';
    }
  }, []);
  
  const getTypeText = useCallback((animal: LivestockWithDetails) => {
    if (animal.isBatch) {
      return `دفعة ${animal.livestockType.name}`;
    }
    return animal.livestockType.name;
  }, []);

  // Calculate percentage change
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const salesChange = calculateChange(stats.sales.today.total, stats.sales.yesterday.total);
  const expensesChange = calculateChange(stats.expenses.today.total, stats.expenses.yesterday.total);
  
  // Chart configuration - memoized for performance
  const COLORS = useMemo(() => ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"], []);
  const chartConfig = useMemo(() => stats.typeCounts.reduce((acc, type, index) => {
      acc[type.name] = {
        label: type.name,
        color: COLORS[index % COLORS.length]
      };
      return acc;
  }, {} as any), [stats.typeCounts, COLORS]);


  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
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
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
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

      {/* Financial Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مبيعات اليوم</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.sales.today.total)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {salesChange >= 0 ? (
                <><ArrowUpRight className="h-3 w-3 text-green-500" /> +{salesChange.toFixed(1)}% من أمس</>
              ) : (
                <><ArrowDownRight className="h-3 w-3 text-red-500" /> {salesChange.toFixed(1)}% من أمس</>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مصروفات اليوم</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.expenses.today.total)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {expensesChange >= 0 ? (
                <><ArrowUpRight className="h-3 w-3 text-red-500" /> +{expensesChange.toFixed(1)}% من أمس</>
              ) : (
                <><ArrowDownRight className="h-3 w-3 text-green-500" /> {expensesChange.toFixed(1)}% من أمس</>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ربح اليوم</CardTitle>
            {stats.profit.today >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.profit.today >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.profit.today)}
            </div>
            <p className="text-xs text-muted-foreground">صافي الربح اليومي</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تبرعات الشهر</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.contributions.thisMonth.total)}</div>
            <p className="text-xs text-muted-foreground">{stats.contributions.thisMonth.count} تبرع هذا الشهر</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
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

      {/* Daily Sales and Expenses Chart */}
      <Card>
        <CardHeader>
          <CardTitle>المبيعات والمصروفات اليومية</CardTitle>
          <CardDescription>عرض المبيعات والمصروفات والأرباح خلال آخر 30 يوم.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis 
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                    return value;
                  }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return formatDateArabic(date);
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'sales') return ['المبيعات', formatCurrency(value)];
                    if (name === 'expenses') return ['المصروفات', formatCurrency(value)];
                    if (name === 'profit') return ['الربح', formatCurrency(value)];
                    return [name, value];
                  }}
                />
                <Legend />
                <Bar dataKey="sales" name="المبيعات" fill="hsl(var(--chart-1))" />
                <Bar dataKey="expenses" name="المصروفات" fill="hsl(var(--chart-2))" />
                <Bar dataKey="profit" name="الربح" fill="hsl(var(--chart-3))" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>ملخص المبيعات</CardTitle>
            <CardDescription>إحصائيات المبيعات المختلفة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">إجمالي المبيعات</span>
              <span className="font-semibold">{formatCurrency(stats.sales.allTime.total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">مدفوع</span>
              <span className="font-semibold text-green-600">{formatCurrency(stats.sales.allTime.paid)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">متبقي</span>
              <span className="font-semibold text-orange-600">{formatCurrency(stats.sales.allTime.remaining)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">عدد العمليات</span>
              <span className="font-semibold">{stats.sales.allTime.count}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">مبيعات الشهر</span>
                <span className="font-semibold">{formatCurrency(stats.sales.thisMonth.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ملخص المصروفات</CardTitle>
            <CardDescription>إحصائيات المصروفات المختلفة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">إجمالي المصروفات</span>
              <span className="font-semibold">{formatCurrency(stats.expenses.allTime.total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">عدد العمليات</span>
              <span className="font-semibold">{stats.expenses.allTime.count}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">مصروفات الشهر</span>
                <span className="font-semibold">{formatCurrency(stats.expenses.thisMonth.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ملخص المشتريات والتبرعات</CardTitle>
            <CardDescription>إحصائيات المشتريات والتبرعات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">المشتريات</span>
              <span className="font-semibold">{formatCurrency(stats.purchases.allTime.total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">التبرعات</span>
              <span className="font-semibold">{formatCurrency(stats.contributions.allTime.total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">النذور</span>
              <span className="font-semibold">{stats.vows.allTime.count} نذر</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">الربح الإجمالي</span>
                <span className={`font-semibold ${stats.profit.allTime >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.profit.allTime)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Livestock List */}
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
              />
            </div>
            <div className="flex gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="فلترة بالنوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {livestockTypes?.map(type => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={barnFilter} onValueChange={setBarnFilter}>
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
              {(isLoading || isPending) && <TableRow><TableCell colSpan={7} className="text-center">جاري التحميل...</TableCell></TableRow>}
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
              {livestock?.length === 0 && !isLoading && !isPending && (
                 <TableRow><TableCell colSpan={7} className="text-center">لا توجد نتائج مطابقة للبحث.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
