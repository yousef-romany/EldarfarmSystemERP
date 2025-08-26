
'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { PlusCircle, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createUser, updateUser, deleteUser, updateUserPermissions } from '@/lib/actions/user.actions';
import type { SessionUser } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSession } from '@/components/session-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { defaultPermissions, adminPermissions } from '@/lib/data';

type UserWithParsedPermissions = Omit<SessionUser, 'permissions'> & {
    id: string;
    role: 'ADMIN' | 'MANAGER' | 'STAFF';
    permissions: any;
};

function SubmitButton({ pendingText = 'جاري الحفظ...', text = 'حفظ' }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingText : text}
    </Button>
  );
}

export default function UsersClientPage({ users }: { users: UserWithParsedPermissions[] }) {
  const { user: sessionUser } = useSession();
  const { toast } = useToast();

  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  
  // State for selected user
  const [selectedUser, setSelectedUser] = useState<UserWithParsedPermissions | null>(null);
  const [currentPermissions, setCurrentPermissions] = useState(defaultPermissions);
  
  // Form states
  const [createState, createFormAction] = useActionState(createUser, { message: null, errors: {}, success: false });
  const updateUserWithId = selectedUser ? updateUser.bind(null, selectedUser.id) : async () => {};
  const [updateState, updateFormAction] = useActionState(updateUserWithId, { message: null, errors: {}, success: false });

  // Handle create user feedback
  useEffect(() => {
    if (createState?.success) {
      toast({ title: 'نجاح', description: createState.message });
      setIsAddDialogOpen(false);
    } else if (createState?.message && !createState.success) {
      toast({ title: 'خطأ', description: createState.message, variant: 'destructive' });
    }
  }, [createState, toast]);

  // Handle update user feedback
  useEffect(() => {
    if (updateState?.success) {
      toast({ title: 'نجاح', description: updateState.message });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } else if (updateState?.message && !updateState.success) {
      toast({ title: 'خطأ', description: updateState.message, variant: 'destructive' });
    }
  }, [updateState, toast]);

  const handleEditClick = (user: UserWithParsedPermissions) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handlePermissionsClick = (user: UserWithParsedPermissions) => {
    setSelectedUser(user);
    setCurrentPermissions(user.permissions);
    setIsPermissionsDialogOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    const result = await deleteUser(id);
    if (result?.success) {
      toast({ title: 'نجاح', description: result.message });
    } else if (result?.message && !result.success) {
      toast({ title: 'خطأ', description: result.message, variant: 'destructive' });
    }
  };
  
  const handlePermissionChange = (category: string, type: 'view' | 'add' | 'edit' | 'delete', value: boolean) => {
    setCurrentPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: value
      }
    }));
  };

  const handlePermissionsSubmit = async () => {
    if (!selectedUser) return;
    const formData = new FormData();
    formData.append('permissions', JSON.stringify(currentPermissions));
    
    const result = await updateUserPermissions(selectedUser.id, formData);
     if (result?.success) {
      toast({ title: 'نجاح', description: result.message });
      setIsPermissionsDialogOpen(false);
    } else if (result?.message && !result.success) {
      toast({ title: 'خطأ', description: result.message, variant: 'destructive' });
    }
  };


  const getRoleText = (role: string) => {
    switch(role) {
      case 'ADMIN': return 'مدير النظام';
      case 'MANAGER': return 'مدير';
      case 'STAFF': return 'موظف';
      default: return role;
    }
  }

  const permissionLabels: { [key: string]: string } = {
    overview: 'نظرة عامة', users: 'المستخدمون', barns: 'العنابر', livestockTypes: 'أنواع المواشي',
    purchases: 'المشتريات', sales: 'سجل المبيعات', pos: 'البيع الفوري', deferredSales: 'البيع الآجل', vows: 'النذور',
    contributions: 'المساهمات', expenses: 'المصروفات', wallets: 'المحافظ', settings: 'الإعدادات', reports: 'التقارير'
  };


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
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
          <CardDescription>عرض وتعديل المستخدمين وصلاحياتهم.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>اسم المستخدم</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <AlertDialog key={user.id}>
                  <TableRow>
                      <TableCell>{user.username}</TableCell>
                      <TableCell><Badge>{getRoleText(user.role)}</Badge></TableCell>
                      <TableCell>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">فتح القائمة</span>
                              </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                              <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                               {sessionUser?.permissions.users.edit && (
                                <>
                                  <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                    <Pencil className="mr-2 h-4 w-4" /> تعديل المستخدم
                                  </DropdownMenuItem>
                                   <DropdownMenuItem onClick={() => handlePermissionsClick(user)}>
                                    <Pencil className="mr-2 h-4 w-4" /> تعديل الصلاحيات
                                  </DropdownMenuItem>
                                </>
                               )}
                               {sessionUser?.permissions.users.delete && user.username !== 'admin' && sessionUser?.id !== user.id && (
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        حذف
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                               )}
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                  </TableRow>
                   <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          سيتم حذف المستخدم "{user.username}" نهائيًا. لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteClick(user.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          نعم، قم بالحذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
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
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid gap-2">
                        <Label htmlFor="username">اسم المستخدم</Label>
                        <Input id="username" name="username" />
                        {createState?.errors?.username && <p className="text-xs text-red-500">{createState.errors.username[0]}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">كلمة المرور</Label>
                        <Input id="password" name="password" type="password" />
                        {createState?.errors?.password && <p className="text-xs text-red-500">{createState.errors.password[0]}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="role">الدور</Label>
                        <Select name="role">
                          <SelectTrigger id="role"><SelectValue placeholder="اختر دورًا" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="STAFF">موظف</SelectItem>
                              <SelectItem value="MANAGER">مدير</SelectItem>
                              <SelectItem value="ADMIN">مدير النظام</SelectItem>
                          </SelectContent>
                        </Select>
                        {createState?.errors?.role && <p className="text-xs text-red-500">{createState.errors.role[0]}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                    <SubmitButton />
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <form action={updateFormAction}>
                <DialogHeader>
                    <DialogTitle>تعديل المستخدم: {selectedUser?.username}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid gap-2">
                        <Label htmlFor="edit-username">اسم المستخدم</Label>
                        <Input id="edit-username" name="username" defaultValue={selectedUser?.username} />
                         {updateState?.errors?.username && <p className="text-xs text-red-500">{updateState.errors.username[0]}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="edit-role">الدور</Label>
                        <Select name="role" defaultValue={selectedUser?.role}>
                          <SelectTrigger id="edit-role"><SelectValue placeholder="اختر دورًا" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="STAFF">موظف</SelectItem>
                              <SelectItem value="MANAGER">مدير</SelectItem>
                              <SelectItem value="ADMIN">مدير النظام</SelectItem>
                          </SelectContent>
                        </Select>
                         {updateState?.errors?.role && <p className="text-xs text-red-500">{updateState.errors.role[0]}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                    <SubmitButton text="حفظ التعديلات" />
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
       {/* Edit Permissions Dialog */}
       <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-4xl overflow-y-scroll max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>تعديل صلاحيات: {selectedUser?.username}</DialogTitle>
                <DialogDescription>
                    تحكم في الوصول لكل جزء من أجزاء النظام لهذا المستخدم.
                </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>القسم</TableHead>
                            <TableHead className="text-center">عرض</TableHead>
                            <TableHead className="text-center">إضافة</TableHead>
                            <TableHead className="text-center">تعديل</TableHead>
                            <TableHead className="text-center">حذف</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(currentPermissions).map(([category, perms]) => (
                            <TableRow key={category}>
                                <TableCell className="font-medium">{permissionLabels[category] || category}</TableCell>
                                <TableCell className="text-center"><Switch checked={perms.view} onCheckedChange={(val) => handlePermissionChange(category, 'view', val)} /></TableCell>
                                <TableCell className="text-center"><Switch checked={perms.add} onCheckedChange={(val) => handlePermissionChange(category, 'add', val)} /></TableCell>
                                <TableCell className="text-center"><Switch checked={perms.edit} onCheckedChange={(val) => handlePermissionChange(category, 'edit', val)} /></TableCell>
                                <TableCell className="text-center"><Switch checked={perms.delete} onCheckedChange={(val) => handlePermissionChange(category, 'delete', val)} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                <Button onClick={handlePermissionsSubmit}>حفظ الصلاحيات</Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>
    </>
  );
}
