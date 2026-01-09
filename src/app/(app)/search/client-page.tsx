'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDateArabic, formatCurrency } from '@/lib/utils';

type SearchCategory = 'all' | 'livestock' | 'sales' | 'expenses' | 'purchases' | 'contributions' | 'vows';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  date: Date;
  amount?: number;
  status?: string;
  link: string;
}

export default function SearchClientPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const performSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: 'تنبيه',
        description: 'رجاء إدخال كلمة البحث',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Search in multiple resources
      const searchPromises: Promise<SearchResult[]>[] = [];

      // Search livestock
      if (category === 'all' || category === 'livestock') {
        searchPromises.push(
          fetch(`/api/livestock?search=${encodeURIComponent(searchTerm)}`).then(res => res.json())
            .then(data => data.map((item: any) => ({
              id: item.id,
              type: 'livestock',
              title: item.tagId || `دفعة ${item.livestockType.name}`,
              description: `${item.livestockType.name} - ${item.breed}`,
              date: new Date(item.createdAt),
              amount: item.cost,
              status: item.status,
              link: `/livestock`,
            })))
        );
      }

      // Search sales
      if (category === 'all' || category === 'sales') {
        searchPromises.push(
          fetch(`/api/sales`).then(res => res.json())
            .then(data => data
              .filter((item: any) => 
                item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((item: any) => ({
                id: item.id,
                type: 'sales',
                title: `مبيع #${item.id.slice(0, 8)}`,
                description: `العميل: ${item.customerName} - ${formatCurrency(item.totalPrice)}`,
                date: new Date(item.saleDate),
                amount: item.totalPrice,
                status: item.status,
                link: `/sales`,
              }))
        ));
      }

      // Search expenses
      if (category === 'all' || category === 'expenses') {
        searchPromises.push(
          fetch(`/api/expenses`).then(res => res.json())
            .then(data => data
              .filter((item: any) => 
                item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((item: any) => ({
                id: item.id,
                type: 'expenses',
                title: `مصروف #${item.id.slice(0, 8)}`,
                description: `${item.description} - ${formatCurrency(item.amount)}`,
                date: new Date(item.date),
                amount: item.amount,
                link: `/expenses`,
              }))
        ));
      }

      // Search purchases
      if (category === 'all' || category === 'purchases') {
        searchPromises.push(
          fetch(`/api/purchases`).then(res => res.json())
            .then(data => data
              .filter((item: any) => 
                item.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((item: any) => ({
                id: item.id,
                type: 'purchases',
                title: `مشتريات #${item.id.slice(0, 8)}`,
                description: `${item.supplier || 'غير محدد'} - ${formatCurrency(item.totalCost)}`,
                date: new Date(item.purchaseDate),
                amount: item.totalCost,
                status: item.status,
                link: `/purchases`,
              }))
        ));
      }

      // Search contributions
      if (category === 'all' || category === 'contributions') {
        searchPromises.push(
          fetch('/api/contributions').then(res => res.json())
            .then(data => data
              .filter((item: any) => 
                item.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((item: any) => ({
                id: item.id,
                type: 'contributions',
                title: `تبرع #${item.id.slice(0, 8)}`,
                description: `${item.donorName} - ${formatCurrency(item.totalAmount)}`,
                date: new Date(item.date),
                amount: item.totalAmount,
                link: `/contributions`,
              }))
        ));
      }

      // Search vows
      if (category === 'all' || category === 'vows') {
        searchPromises.push(
          fetch('/api/vows').then(res => res.json())
            .then(data => data
              .filter((item: any) => 
                item.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((item: any) => ({
                id: item.id,
                type: 'vows',
                title: `نذر #${item.id.slice(0, 8)}`,
                description: `المتبرع: ${item.donorName}`,
                date: new Date(item.date),
                link: `/vows`,
              }))
        ));
      }

      const allResults = await Promise.all(searchPromises);
      const flattenedResults = allResults.flat();
      
      setResults(flattenedResults);
      
      if (flattenedResults.length === 0) {
        toast({
          title: 'لا توجد نتائج',
          description: 'لم يتم العثور على نتائج مطابقة للبحث',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'تم البحث',
          description: `تم العثور على ${flattenedResults.length} نتيجة`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'خطأ في البحث',
        description: error.message || 'فشل في إجراء البحث',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'livestock': return '🐄';
      case 'sales': return '💰';
      case 'expenses': return '💸';
      case 'purchases': return '🛒';
      case 'contributions': return '💝';
      case 'vows': return '🙏';
      default: return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'livestock': return 'bg-green-100 text-green-800';
      case 'sales': return 'bg-blue-100 text-blue-800';
      case 'expenses': return 'bg-red-100 text-red-800';
      case 'purchases': return 'bg-purple-100 text-purple-800';
      case 'contributions': return 'bg-yellow-100 text-yellow-800';
      case 'vows': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (type: string, status?: string) => {
    if (!status) return null;
    
    switch (type) {
      case 'livestock':
        switch (status) {
          case 'Available': return <Badge variant="default">متاح</Badge>;
          case 'Sold': return <Badge variant="destructive">مباع</Badge>;
          case 'Vowed': return <Badge variant="secondary">نذر</Badge>;
          case 'PendingSale': return <Badge variant="outline">بيع آجل</Badge>;
          default: return <Badge variant="outline">{status}</Badge>;
        }
        break;
      case 'sales':
      case 'purchases':
        switch (status) {
          case 'Draft': return <Badge variant="outline">مسودة</Badge>;
          case 'Pending': return <Badge variant="secondary">معلق</Badge>;
          case 'Completed': return <Badge variant="default">مكتمل</Badge>;
          case 'Cancelled': return <Badge variant="destructive">ملغي</Badge>;
          default: return <Badge variant="outline">{status}</Badge>;
        }
        break;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            البحث المتقدم
          </CardTitle>
          <CardDescription>
            ابحث في جميع بيانات النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن أي شيء..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                  className="pl-10"
                />
              </div>
              <Select value={category} onValueChange={(value: SearchCategory) => setCategory(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="livestock">المواشي</SelectItem>
                  <SelectItem value="sales">المبيعات</SelectItem>
                  <SelectItem value="expenses">المصروفات</SelectItem>
                  <SelectItem value="purchases">المشتريات</SelectItem>
                  <SelectItem value="contributions">التبرعات</SelectItem>
                  <SelectItem value="vows">النذور</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={performSearch} disabled={isLoading}>
                {isLoading ? 'جاري البحث...' : 'بحث'}
              </Button>
              {searchTerm && (
                <Button onClick={clearSearch} variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  مسح
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                نتائج البحث ({results.length})
              </span>
              <Badge variant="secondary">{category === 'all' ? 'الكل' : category}</Badge>
            </CardTitle>
            <CardDescription>
              عرض جميع النتائج المطابقة للبحث
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead className="text-left">المبلغ</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={`${result.type}-${result.id}`}>
                    <TableCell>
                      <span className="text-2xl">{getTypeIcon(result.type)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(result.type)}>
                        {result.type === 'livestock' ? 'مواشي' :
                         result.type === 'sales' ? 'مبيعات' :
                         result.type === 'expenses' ? 'مصروفات' :
                         result.type === 'purchases' ? 'مشتريات' :
                         result.type === 'contributions' ? 'تبرعات' :
                         result.type === 'vows' ? 'نذور' : result.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{result.title}</TableCell>
                    <TableCell className="text-muted-foreground">{result.description}</TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(result.type, result.status)}
                    </TableCell>
                    <TableCell>{formatDateArabic(result.date)}</TableCell>
                    <TableCell className="text-left">
                      {result.amount !== undefined ? formatCurrency(result.amount) : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.location.href = result.link}
                      >
                        عرض
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {results.length === 0 && searchTerm && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد نتائج</h3>
            <p className="text-muted-foreground">
              لم يتم العثور على نتائج مطابقة للبحث "{searchTerm}"
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              جرب البحث بكلمات مختلفة أو قم بتغيير فئة البحث
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
