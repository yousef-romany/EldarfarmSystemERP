
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { LogAction, EntityType } from '@prisma/client';

export default async function LogsPage() {
  const logs = await prisma.log.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
    take: 100, // Limit to the last 100 logs for performance
  });

  const getActionVariant = (action: LogAction) => {
    switch (action) {
      case 'CREATE': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      case 'LOGIN': return 'outline';
      default: return 'outline';
    }
  };
  
  const getActionText = (action: LogAction) => {
    switch (action) {
      case 'CREATE': return 'إنشاء';
      case 'UPDATE': return 'تحديث';
      case 'DELETE': return 'حذف';
      case 'LOGIN': return 'دخول';
      case 'LOGOUT': return 'خروج';
      default: return action;
    }
  };
  
  const getEntityText = (entity: EntityType) => {
    const map: Record<EntityType, string> = {
        USER: 'مستخدم',
        BARN: 'عنبر',
        LIVESTOCK_TYPE: 'نوع ماشية',
        LIVESTOCK: 'ماشية',
        PURCHASE: 'شراء',
        PURCHASE_DRAFT: 'مسودة شراء',
        SALE: 'بيع',
        SALE_DRAFT: 'مسودة بيع',
        VOW: 'نذر',
        CONTRIBUTION: 'مساهمة',
        EXPENSE: 'مصروف',
        WALLET: 'محفظة',
    };
    return map[entity] || entity;
  }

  return (
    <>
      <PageHeader title="سجلات النظام" />
      <Card>
        <CardHeader>
          <CardTitle>أحدث النشاطات</CardTitle>
          <CardDescription>عرض لآخر 100 إجراء تم تسجيله في النظام.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الوقت</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>الإجراء</TableHead>
                <TableHead>الكيان</TableHead>
                <TableHead>التفاصيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                  <TableCell>{log.user.username}</TableCell>
                  <TableCell>
                    <Badge variant={getActionVariant(log.action)}>{getActionText(log.action)}</Badge>
                  </TableCell>
                  <TableCell>{getEntityText(log.entityType)} ({log.entityId.substring(0,8)})</TableCell>
                  <TableCell className="text-right">{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
