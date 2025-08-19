
'use client';
import { MoreHorizontal, PlusCircle, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { users } from '@/lib/data';
import type { User, UserPermissions, Permission } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function UsersPage() {
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentUserPermissions, setCurrentUserPermissions] = useState<UserPermissions | null>(null);

  const getRoleVariant = (role: User['role']) => {
    switch (role) {
      case 'Admin': return 'default';
      case 'Manager': return 'secondary';
      case 'Staff': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleText = (role: User['role']) => {
    switch (role) {
      case 'Admin': return 'مدير';
      case 'Manager': return 'مشرف';
      case 'Staff': return 'موظف';
    }
  }
  
  const permissionLabels: { [key in keyof UserPermissions]: string } = {
    overview: 'نظرة عامة',
    users: 'المستخدمون',
    barns: 'العنابر',
    purchases: 'المشتريات',
    sales: 'المبيعات',
    vows: 'النذور',
    contributions: 'المساهمات النقدية',
    expenses: 'المصروفات',
    wallets: 'المحافظ',
    settings: 'الإعدادات',
  };

  const openPermissionsDialog = (user: User) => {
    setSelectedUser(user);
    // Deep copy permissions to avoid modifying the original data directly
    setCurrentUserPermissions(JSON.parse(JSON.stringify(user.permissions)));
    setIsPermissionsDialogOpen(true);
  };

  const handlePermissionChange = (
    page: keyof UserPermissions,
    permission: keyof Permission,
    value: boolean
  ) => {
    if (currentUserPermissions) {
      setCurrentUserPermissions({
        ...currentUserPermissions,
        [page]: {
          ...currentUserPermissions[page],
          [permission]: value,
        },
      });
    }
  };


  return (
    <>
      <PageHeader
        title="إدارة المستخدمين"
        action={
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            إضافة مستخدم
          </Button>
        }
      />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar data-ai-hint="person portrait">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">
                        <div>{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleVariant(user.role)}>{getRoleText(user.role)}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                        <DropdownMenuItem>تعديل</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openPermissionsDialog(user)}>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            تعديل الصلاحيات
                        </DropdownMenuItem>
                        <DropdownMenuItem>حذف</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                  <DialogDescription>
                      املأ البيانات التالية لإنشاء حساب مستخدم جديد.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                      <Label htmlFor="new-user-name">الاسم الكامل</Label>
                      <Input id="new-user-name" placeholder="e.g., محمد علي" />
                  </div>
                   <div className="grid gap-2">
                      <Label htmlFor="new-user-email">البريد الإلكتروني</Label>
                      <Input id="new-user-email" type="email" placeholder="e.g., user@example.com" />
                  </div>
                   <div className="grid gap-2">
                      <Label htmlFor="new-user-password">كلمة المرور</Label>
                      <Input id="new-user-password" type="password" />
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="new-user-role">الدور</Label>
                      <Select>
                          <SelectTrigger id="new-user-role">
                              <SelectValue placeholder="اختر دور المستخدم" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Admin">مدير</SelectItem>
                              <SelectItem value="Manager">مشرف</SelectItem>
                              <SelectItem value="Staff">موظف</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="secondary">إلغاء</Button>
                  </DialogClose>
                  <Button type="submit">حفظ وإنشاء</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>تعديل صلاحيات المستخدم: {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              تحكم في الوصول لكل صفحة ونوع عملية يمكن للمستخدم القيام بها.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            {currentUserPermissions && Object.entries(currentUserPermissions).map(([pageKey, permissions]) => (
              <div key={pageKey} className="mb-4">
                 <h4 className="text-lg font-semibold mb-3">{permissionLabels[pageKey as keyof UserPermissions]}</h4>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                        <Switch id={`${pageKey}-view`} checked={permissions.view} onCheckedChange={(val) => handlePermissionChange(pageKey as keyof UserPermissions, 'view', val)} />
                        <Label htmlFor={`${pageKey}-view`}>عرض</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id={`${pageKey}-add`} checked={permissions.add} onCheckedChange={(val) => handlePermissionChange(pageKey as keyof UserPermissions, 'add', val)} />
                        <Label htmlFor={`${pageKey}-add`}>إضافة</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id={`${pageKey}-edit`} checked={permissions.edit} onCheckedChange={(val) => handlePermissionChange(pageKey as keyof UserPermissions, 'edit', val)} />
                        <Label htmlFor={`${pageKey}-edit`}>تعديل</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id={`${pageKey}-delete`} checked={permissions.delete} onCheckedChange={(val) => handlePermissionChange(pageKey as keyof UserPermissions, 'delete', val)} />
                        <Label htmlFor={`${pageKey}-delete`}>حذف</Label>
                    </div>
                 </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">إلغاء</Button>
            </DialogClose>
            <Button type="button">حفظ الصلاحيات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
