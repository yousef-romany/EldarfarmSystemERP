
'use client';
import { useState } from 'react';
import { PlusCircle, MoreHorizontal, Box, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock data - replace with actual data fetching
const livestockTypes = [
  { id: 'type-1', name: 'أبقار' },
  { id: 'type-2', name: 'أغنام' },
  { id: 'type-3', name: 'دواجن' },
];

const livestockBreeds = [
  { id: 'breed-1', name: 'هولشتاين', type: 'أبقار' },
  { id: 'breed-2', name: 'عسافي', type: 'أغنام' },
  { id: 'breed-3', name: 'ساسو', type: 'دواجن' },
  { id: 'breed-4', name: 'براون سويس', type: 'أبقار' },
];

export default function LivestockTypesPage() {
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [isBreedDialogOpen, setIsBreedDialogOpen] = useState(false);

  return (
    <>
      <PageHeader title="إدارة أنواع وسلالات المواشي" />
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
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

        {/* Livestock Breeds Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>سلالات المواشي</CardTitle>
              <Button onClick={() => setIsBreedDialogOpen(true)} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                إضافة سلالة
              </Button>
            </div>
            <CardDescription>
              إدارة السلالات المختلفة لكل نوع من المواشي.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم السلالة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {livestockBreeds.map((breed) => (
                  <TableRow key={breed.id}>
                    <TableCell className="font-medium">{breed.name}</TableCell>
                    <TableCell>{breed.type}</TableCell>
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

      {/* Add/Edit Breed Dialog */}
      <Dialog open={isBreedDialogOpen} onOpenChange={setIsBreedDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة سلالة جديدة</DialogTitle>
            <DialogDescription>
              أدخل اسم السلالة واختر النوع الذي تتبعه.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="breed-name" className="text-right">
                اسم السلالة
              </Label>
              <Input id="breed-name" placeholder="e.g., برقي" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="breed-type" className="text-right">
                النوع
              </Label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  {livestockTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
