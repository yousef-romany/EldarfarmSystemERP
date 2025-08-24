
'use client';
import { MoreHorizontal, PlusCircle, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { useState, useEffect, useActionState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { createUser, updateUserPermissions } from '@/lib/actions/user.actions';
import type { User as PrismaUser } from '@prisma/client';
import type { UserPermissions, Permission } from '@/lib/types';
import { useSession } from '@/components/session-provider';


type UserWithPermissions = Omit<PrismaUser, 'permissions'> & {
  permissions: UserPermissions;
};

const permissionLabels: { [key in keyof UserPermissions]: string } = {
    overview: 'نظرة عامة',
    users: 'المستخدمون',
    barns: 'العنابر',
    livestockTypes: 'أنواع المواشي',
    purchases: 'المشتريات',
    sales: 'المبيعات',
    vows: 'النذور',
    contributions: 'المساهمات النقدية',
    expenses: 'المصروفات',
    wallets: 'المحافظ',
    settings: 'الإعدادات',
    reports: 'التقارير'
};

function AddUserSubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'جاري الإنشاء...' : 'حفظ وإنشاء'}
        </Button>
    )
}

function PermissionsSubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
        </Button>
    )
}

export default function UsersClientPage({ users }: { users: UserWithPermissions[] }) {
  const { user: sessionUser } = useSession();
  const { toast } = useToast();
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [currentUserPermissions, setCurrentUserPermissions] = useState<UserPermissions | null>(null);
  
  const [createState, createFormAction] = useActionState(createUser, { message: null, errors: {}, success: false });

  useEffect(() => {
    if (createState.success) {
      toast({ title: 'نجاح', description: createState.message });
      setIsAddDialogOpen(false);
    } else if (createState.message && !createState.success) {
      toast({ title: 'خطأ', description: createState.message, variant: 'destructive' });
    }
  }, [createState, toast]);

  const getRoleVariant = (role: PrismaUser['role']) => {
    switch (role) {
      case 'ADMIN': return 'default';
      case 'MANAGER': return 'secondary';
      case 'STAFF': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleText = (role: PrismaUser['role']) => {
    switch (role) {
      case 'ADMIN': return 'مدير النظام';
      case 'MANAGER': return 'مشرف';
      case 'STAFF': return 'موظف';
    }
  }

  const openPermissionsDialog = (user: UserWithPermissions) => {
    setSelectedUser(user);
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
  
  const handleUpdatePermissions = async (formData: FormData) => {
      if (!selectedUser) return;
      // We need to bind the userId to the server action
      const action = updateUserPermissions.bind(null, selectedUser.id);
      const result = await action(formData);
      if (result?.success) {
        toast({ title: 'نجاح', description: result.message });
        setIsPermissionsDialogOpen(false);
      } else {
        toast({ title: 'خطأ', description: result.message, variant: 'destructive' });
      }
  }


  return (
    <>
      <PageHeader
        title="إدارة المستخدمين"
        action={
          sessionUser?.permissions.users.add && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              إضافة مستخدم
            </Button>
          )
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
                        <AvatarImage src={user.avatar || undefined} alt={user.username} />
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">
                        <div>{user.username}</div>
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
                        {sessionUser?.permissions.users.edit && <DropdownMenuItem>تعديل</DropdownMenuItem> }
                        {sessionUser?.permissions.users.edit && (
                           <DropdownMenuItem onClick={() => openPermissionsDialog(user)}>
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              تعديل الصلاحيات
                          </DropdownMenuItem>
                        )}
                        {sessionUser?.permissions.users.delete && <DropdownMenuItem>حذف</DropdownMenuItem>}
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
            <form action={createFormAction}>
                <DialogHeader>
                    <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                    <DialogDescription>
                        املأ البيانات التالية لإنشاء حساب مستخدم جديد.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="new-user-name">اسم المستخدم (للدخول)</Label>
                        <Input id="new-user-name" name="username" placeholder="e.g., mohamed.ali" required />
                        {createState?.errors?.username && <p className="text-xs text-red-500">{createState.errors.username[0]}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="new-user-password">كلمة المرور</Label>
                        <Input id="new-user-password" name="password" type="password" required />
                         {createState?.errors?.password && <p className="text-xs text-red-500">{createState.errors.password[0]}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="new-user-role">الدور</Label>
                        <Select name="role" required>
                            <SelectTrigger id="new-user-role">
                                <SelectValue placeholder="اختر دور المستخدم" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="STAFF">موظف</SelectItem>
                                <SelectItem value="MANAGER">مشرف</SelectItem>
                                <SelectItem value="ADMIN">مدير النظام</SelectItem>
                            </SelectContent>
                        </Select>
                         {createState?.errors?.role && <p className="text-xs text-red-500">{createState.errors.role[0]}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">إلغاء</Button>
                    </DialogClose>
                    <AddUserSubmitButton />
                </DialogFooter>
            </form>
          </DialogContent>
      </Dialog>
      
      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
            <form action={handleUpdatePermissions}>
          <DialogHeader>
            <DialogTitle>تعديل صلاحيات المستخدم: {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              تحكم في الوصول لكل صفحة ونوع عملية يمكن للمستخدم القيام بها.
            </DialogDescription>
          </DialogHeader>
           <input type="hidden" name="permissions" value={JSON.stringify(currentUserPermissions)} />
          <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            {currentUserPermissions && Object.entries(currentUserPermissions).map(([pageKey, permissions]) => (
              <div key={pageKey} className="mb-4">
                 <h4 className="text-lg font-semibold mb-3">{permissionLabels[pageKey as keyof UserPermissions]}</h4>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                        <Switch id={`${pageKey}-view`} checked={(permissions as Permission).view} onCheckedChange={(val) => handlePermissionChange(pageKey as keyof UserPermissions, 'view', val)} />
                        <Label htmlFor={`${pageKey}-view`}>عرض</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id={`${pageKey}-add`} checked={(permissions as Permission).add} onCheckedChange={(val) => handlePermissionChange(pageKey as keyof UserPermissions, 'add', val)} />
                        <Label htmlFor={`${pageKey}-add`}>إضافة</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id={`${pageKey}-edit`} checked={(permissions as Permission).edit} onCheckedChange={(val) => handlePermissionChange(pageKey as keyof UserPermissions, 'edit', val)} />
                        <Label htmlFor={`${pageKey}-edit`}>تعديل</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id={`${pageKey}-delete`} checked={(permissions as Permission).delete} onCheckedChange={(val) => handlePermissionChange(pageKey as keyof UserPermissions, 'delete', val)} />
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
            <PermissionsSubmitButton />
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
