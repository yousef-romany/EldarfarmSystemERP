
'use client';
import { useState } from 'react';
import { PlusCircle, Warehouse, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { barns } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function BarnsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="إدارة العنابر"
        action={
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            إضافة عنبر
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {barns.map((barn) => (
          <Card key={barn.id}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Warehouse className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <CardTitle>{barn.name}</CardTitle>
                            <CardDescription>
                                السعة: {barn.capacity} رأس
                            </CardDescription>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">فتح القائمة</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                        <DropdownMenuItem>تعديل</DropdownMenuItem>
                        <DropdownMenuItem>عرض الحيوانات</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                            حذف
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground mb-2">
                    الإشغال: {barn.currentOccupancy} / {barn.capacity}
                </div>
              <Progress value={(barn.currentOccupancy / barn.capacity) * 100} className="h-3" />
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                مساحة فارغة لـ {barn.capacity - barn.currentOccupancy} رأس
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>

       {/* Add Barn Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة عنبر جديد</DialogTitle>
            <DialogDescription>
              املأ البيانات التالية لإنشاء عنبر جديد في المزرعة.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="barn-name" className="text-right">
                اسم العنبر
              </Label>
              <Input id="barn-name" placeholder="e.g., عنبر التسمين الغربي" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="barn-capacity" className="text-right">
                السعة (رأس)
              </Label>
              <Input id="barn-capacity" type="number" placeholder="e.g., 100" className="col-span-3" />
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
