'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ArrowRight,
  Calendar,
  DollarSign
} from 'lucide-react';
import { formatDateArabic, formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type ReportType = 'profit-loss' | 'inventory' | 'movement';

interface ReportData {
  type: string;
  period?: { start: Date; end: Date };
  summary?: any;
  expensesByCategory?: Record<string, number>;
  byBarn?: Record<string, any>;
  byType?: Record<string, any>;
  byStatus?: Record<string, number>;
  movements?: any[];
}

export default function AdvancedReportsClientPage() {
  const [reportType, setReportType] = useState<ReportType>('profit-loss');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('type', reportType);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`/api/reports/advanced?${params.toString()}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setReportData(data);
      toast({
        title: 'تم إنشاء التقرير',
        description: 'تم إنشاء التقرير بنجاح',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إنشاء التقرير',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    let csvContent = '';
    
    switch (reportData.type) {
      case 'profit-loss':
        csvContent = 'الفئة,المبلغ\n';
        if (reportData.expensesByCategory) {
          Object.entries(reportData.expensesByCategory).forEach(([category, amount]) => {
            csvContent += `${category},${amount}\n`;
          });
        }
        if (reportData.summary) {
          csvContent += `\nالإجمالي المبيعات,${reportData.summary.totalSales}\n`;
          csvContent += `إجمالي المشتريات,${reportData.summary.totalPurchases}\n`;
          csvContent += `إجمالي المصروفات,${reportData.summary.totalExpenses}\n`;
          csvContent += `الربح الإجمالي,${reportData.summary.grossProfit}\n`;
          csvContent += `الربح الصافي,${reportData.summary.netProfit}\n`;
        }
        break;

      case 'inventory':
        csvContent = 'العنبر,النوع,العدد,القيمة\n';
        if (reportData.byBarn) {
          Object.entries(reportData.byBarn).forEach(([barnName, data]) => {
            Object.entries(data.types).forEach(([typeName, count]) => {
              csvContent += `${barnName},${typeName},${count},\n`;
            });
          });
        }
        if (reportData.summary) {
          csvContent += `\nإجمالي العدد,${reportData.summary.totalLivestockCount}\n`;
          csvContent += `إجمالي القيمة,${reportData.summary.totalLivestockValue}\n`;
        }
        break;

      case 'movement':
        csvContent = 'التاريخ,النوع,السلالة,العنبر,الكمية,الحالة,الإجراء\n';
        if (reportData.movements) {
          reportData.movements.forEach((movement) => {
            csvContent += `${formatDateArabic(movement.date)},${movement.type},${movement.breed},${movement.barn},${movement.quantity},${movement.status},${movement.action}\n`;
          });
        }
        break;
    }

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'profit-loss': return 'تقرير الأرباح والخسائر';
      case 'inventory': return 'تقرير المخزون';
      case 'movement': return 'تقرير حركة المواشي';
      default: return 'تقرير';
    }
  };

  const getReportDescription = () => {
    switch (reportType) {
      case 'profit-loss': return 'عرض الأرباح والخسائر خلال فترة محددة';
      case 'inventory': return 'عرض المخزون الحالي وتوزيعه';
      case 'movement': return 'عرض حركة المواشي خلال فترة محددة';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            اختيار نوع التقرير
          </CardTitle>
          <CardDescription>
            اختر نوع التقرير الذي تريد إنشاؤه
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant={reportType === 'profit-loss' ? 'default' : 'outline'}
              onClick={() => setReportType('profit-loss')}
              className="h-auto flex-col items-start gap-2 p-4"
            >
              <DollarSign className="h-6 w-6" />
              <div className="text-right">
                <div className="font-semibold">الأرباح والخسائر</div>
                <div className="text-xs text-muted-foreground">
                  عرض الأرباح والخسائر
                </div>
              </div>
            </Button>
            <Button
              variant={reportType === 'inventory' ? 'default' : 'outline'}
              onClick={() => setReportType('inventory')}
              className="h-auto flex-col items-start gap-2 p-4"
            >
              <Package className="h-6 w-6" />
              <div className="text-right">
                <div className="font-semibold">المخزون</div>
                <div className="text-xs text-muted-foreground">
                  عرض المخزون الحالي
                </div>
              </div>
            </Button>
            <Button
              variant={reportType === 'movement' ? 'default' : 'outline'}
              onClick={() => setReportType('movement')}
              className="h-auto flex-col items-start gap-2 p-4"
            >
              <ArrowRight className="h-6 w-6" />
              <div className="text-right">
                <div className="font-semibold">حركة المواشي</div>
                <div className="text-xs text-muted-foreground">
                  عرض حركة المواشي
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Date Range Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            تحديد الفترة الزمنية
          </CardTitle>
          <CardDescription>
            حدد الفترة الزمنية للتقرير (اختياري)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">تاريخ البداية</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">تاريخ النهاية</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rtl"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={generateReport} disabled={isLoading}>
              {isLoading ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
            </Button>
            {reportData && (
              <Button onClick={exportReport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                تصدير CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>{getReportTitle()}</CardTitle>
            <CardDescription>{getReportDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.type === 'profit-loss' && reportData.summary && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">إجمالي المبيعات</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(reportData.summary.totalSales)}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">إجمالي المشتريات</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(reportData.summary.totalPurchases)}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">إجمالي المصروفات</div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(reportData.summary.totalExpenses)}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">الربح الإجمالي</div>
                    <div className={`text-2xl font-bold ${reportData.summary.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(reportData.summary.grossProfit)}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">الربح الصافي</div>
                    <div className={`text-2xl font-bold ${reportData.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(reportData.summary.netProfit)}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">المتبقي من المبيعات</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(reportData.summary.totalRemainingSales)}
                    </div>
                  </div>
                </div>

                {/* Expenses by Category */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">المصروفات حسب الفئة</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الفئة</TableHead>
                        <TableHead className="text-left">المبلغ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.expensesByCategory && Object.entries(reportData.expensesByCategory).map(([category, amount]) => (
                        <TableRow key={category}>
                          <TableCell className="font-medium">{category}</TableCell>
                          <TableCell className="text-left">{formatCurrency(amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {reportData.type === 'inventory' && reportData.summary && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">إجمالي العدد</div>
                    <div className="text-2xl font-bold">
                      {reportData.summary.totalLivestockCount} رأس
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">إجمالي القيمة</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(reportData.summary.totalLivestockValue)}
                    </div>
                  </div>
                </div>

                {/* By Barn */}
                {reportData.byBarn && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">التوزيع حسب العنبر</h3>
                    <div className="space-y-4">
                      {Object.entries(reportData.byBarn).map(([barnName, data]) => (
                        <Card key={barnName}>
                          <CardHeader>
                            <CardTitle className="text-base">{barnName}</CardTitle>
                            <CardDescription>
                              {data.count} رأس - {formatCurrency(data.value)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>النوع</TableHead>
                                  <TableHead className="text-center">العدد</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Object.entries(data.types).map(([typeName, count]) => (
                                  <TableRow key={typeName}>
                                    <TableCell className="font-medium">{typeName}</TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="secondary">{count as number}</Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* By Type */}
                {reportData.byType && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">التوزيع حسب النوع</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>النوع</TableHead>
                          <TableHead className="text-center">العدد</TableHead>
                          <TableHead className="text-left">القيمة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(reportData.byType).map(([typeName, data]) => (
                          <TableRow key={typeName}>
                            <TableCell className="font-medium">{typeName}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{data.count}</Badge>
                            </TableCell>
                            <TableCell className="text-left">{formatCurrency(data.value)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* By Status */}
                {reportData.byStatus && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">التوزيع حسب الحالة</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الحالة</TableHead>
                          <TableHead className="text-center">العدد</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(reportData.byStatus).map(([status, count]) => (
                          <TableRow key={status}>
                            <TableCell className="font-medium">
                              {status === 'Available' ? 'متاح' :
                               status === 'Sold' ? 'مباع' :
                               status === 'Vowed' ? 'نذر' :
                               status === 'PendingSale' ? 'بيع آجل' : status}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{count as number}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {reportData.type === 'movement' && reportData.summary && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">تمت إضافتها</div>
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.summary.added}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">تم بيعها</div>
                    <div className="text-2xl font-bold text-red-600">
                      {reportData.summary.sold}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">تم نذرها</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.summary.vowed}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">بيع آجل</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {reportData.summary.pendingSale}
                    </div>
                  </div>
                </div>

                {/* Movements Table */}
                {reportData.movements && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">تفاصيل الحركة</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>التاريخ</TableHead>
                          <TableHead>النوع</TableHead>
                          <TableHead>السلالة</TableHead>
                          <TableHead>العنبر</TableHead>
                          <TableHead className="text-center">الكمية</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>الإجراء</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.movements.map((movement) => (
                          <TableRow key={movement.id}>
                            <TableCell>{formatDateArabic(movement.date)}</TableCell>
                            <TableCell className="font-medium">{movement.type}</TableCell>
                            <TableCell>{movement.breed}</TableCell>
                            <TableCell>{movement.barn}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{movement.quantity}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                movement.status === 'Available' ? 'default' :
                                movement.status === 'Sold' ? 'destructive' :
                                movement.status === 'Vowed' ? 'secondary' : 'outline'
                              }>
                                {movement.status === 'Available' ? 'متاح' :
                                 movement.status === 'Sold' ? 'مباع' :
                                 movement.status === 'Vowed' ? 'نذر' :
                                 movement.status === 'PendingSale' ? 'بيع آجل' : movement.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {movement.action === 'Added' ? (
                                <Badge className="bg-green-100 text-green-800">
                                  تمت الإضافة
                                </Badge>
                              ) : movement.action === 'Sold' ? (
                                <Badge variant="destructive">
                                  تم البيع
                                </Badge>
                              ) : movement.action === 'Vowed' ? (
                                <Badge className="bg-blue-100 text-blue-800">
                                  تم النذر
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  معلق
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
