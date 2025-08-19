
'use client';
import { useState } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Mock data - replace with actual data fetching
const livestockTypes = [
  { id: 'type-1', name: 'أبقار' },
  { id: 'type-2', name: 'أغنام' },
  { id: 'type-3', name: 'دواجن' },
];

export default function LivestockTypesPage() {
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);

  return (
    <>
      <PageHeader title="إدارة أنواع المواشي" />
      <div className="grid gap-6 md:grid-cols-1">
        {/* Livestock Types Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>أنواع المواشي</CardTitle>
              <Button onClick={() => setIsTypeDialogOpen(true)} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                إضافة نوع
              </Button>
            </div>
            <CardDescription>
              إدارة الأنواع الرئيسية للمواشي في المزرعة.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم النوع</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {livestockTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell className="text-left">
                       <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Type Dialog */}
      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة نوع جديد</DialogTitle>
            <DialogDescription>
              أدخل اسم النوع الرئيسي الجديد للمواشي.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type-name" className="text-right">
                اسم النوع
              </Label>
              <Input id="type-name" placeholder="e.g., جمال" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                إلغاء
              </Button>
            </DialogClose>
            <Button type="submit">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
