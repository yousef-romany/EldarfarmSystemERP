
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminPermissions, managerPermissions, staffPermissions, developerPermissions } from '@/lib/data';
import { Prisma } from '@prisma/client';

const UserRole = z.enum(['DEVELOPER', 'ADMIN', 'MANAGER', 'STAFF']);

const createUserSchema = z.object({
  username: z.string().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  role: UserRole,
});

const updateUserSchema = z.object({
    username: z.string().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'),
    role: UserRole,
});

const updateUserPermissionsSchema = z.object({
  permissions: z.string(), // We'll receive it as a stringified JSON
});

const updatePasswordSchema = z.object({
    currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "كلمتا المرور الجديدتان غير متطابقتين",
    path: ["confirmPassword"],
});


type UserState = {
  errors?: z.ZodError<typeof createUserSchema>['formErrors']['fieldErrors'];
  message?: string | null;
  success?: boolean;
}

type UpdateUserState = {
  errors?: z.ZodError<typeof updateUserSchema>['formErrors']['fieldErrors'];
  message?: string | null;
  success?: boolean;
}

type UpdatePasswordState = {
    message?: string | null;
    success: boolean;
}

export async function createUser(prevState: UserState, formData: FormData): Promise<UserState> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user) {
     redirect('/login');
  }
  
  if (!session.user.permissions?.users?.add) {
    return { message: 'ليس لديك الصلاحية لإضافة مستخدمين.', success: false };
  }

  const validatedFields = createUserSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
    role: formData.get('role'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'بيانات غير صالحة.',
      success: false,
    };
  }

  const { username, password, role } = validatedFields.data;

  // Assign permissions based on role
  let permissions;
    switch (role) {
        case 'DEVELOPER':
            permissions = developerPermissions;
            break;
        case 'ADMIN':
            permissions = adminPermissions;
            break;
        case 'MANAGER':
            permissions = managerPermissions;
            break;
        case 'STAFF':
            permissions = staffPermissions;
            break;
        default:
            permissions = staffPermissions;
    }


  try {
    const user = await prisma.user.create({
      data: {
        username,
        password, // In a real app, this should be hashed!
        role,
        permissions: JSON.stringify(permissions),
        avatar: `https://i.pravatar.cc/150?u=${username}` // Placeholder avatar
      },
    });

    await prisma.log.create({
        data: {
            userId: session.user.id,
            action: 'CREATE',
            entityType: 'USER',
            entityId: user.id,
            details: `أنشأ مستخدمًا جديدًا: ${username} بدور: ${role}`
        }
    });

    revalidatePath('/users');
    return { message: 'تم إنشاء المستخدم بنجاح!', success: true };
  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { message: 'اسم المستخدم هذا موجود بالفعل.', success: false };
    }
    console.error('Error creating user:', error);
    return { message: 'فشل في إنشاء المستخدم.', success: false };
  }
}

export async function updateUser(userId: string, prevState: UpdateUserState, formData: FormData): Promise<UpdateUserState> {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
        redirect('/login');
    }

    if (!session.user.permissions?.users?.edit) {
        return { message: 'ليس لديك الصلاحية لتعديل المستخدمين.', success: false };
    }

    const userToUpdate = await prisma.user.findUnique({ where: { id: userId } });
    if (userToUpdate?.role === 'DEVELOPER' || userToUpdate?.role === 'ADMIN') {
        return { message: 'لا يمكن تعديل بيانات المطور أو مدير آخر.', success: false };
    }

    const validatedFields = updateUserSchema.safeParse({
        username: formData.get('username'),
        role: formData.get('role'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'بيانات غير صالحة.',
            success: false,
        };
    }
    
    const { username, role } = validatedFields.data;
    
    // Assign permissions based on role
    let permissions;
    switch (role) {
        case 'DEVELOPER':
             return { message: 'لا يمكن تعيين دور المطور.', success: false };
        case 'ADMIN':
            permissions = adminPermissions;
            break;
        case 'MANAGER':
            permissions = managerPermissions;
            break;
        case 'STAFF':
            permissions = staffPermissions;
            break;
        default:
            permissions = staffPermissions;
    }

    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                username,
                role,
                permissions: JSON.stringify(permissions),
            },
        });

        await prisma.log.create({
            data: {
                userId: session.user.id,
                action: 'UPDATE',
                entityType: 'USER',
                entityId: user.id,
                details: `قام بتحديث بيانات المستخدم: ${username} إلى دور ${role}`
            }
        });

        revalidatePath('/users');
        return { message: 'تم تحديث المستخدم بنجاح!', success: true };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return { message: 'اسم المستخدم هذا موجود بالفعل.', success: false };
        }
        console.error('Error updating user:', error);
        return { message: 'فشل في تحديث المستخدم.', success: false };
    }
}


export async function updateUserPermissions(userId: string, formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user) {
    return { message: 'جلسة غير صالحة.', success: false };
  }

  if (!session.user.permissions?.users?.edit) {
    return { message: 'ليس لديك الصلاحية لتعديل الصلاحيات.', success: false };
  }
  
  const userToUpdate = await prisma.user.findUnique({ where: { id: userId } });
  if (userToUpdate?.role === 'DEVELOPER') {
      return { message: 'لا يمكن تعديل صلاحيات المطور.', success: false };
  }

  const validatedFields = updateUserPermissionsSchema.safeParse({
    permissions: formData.get('permissions'),
  });

   if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'بيانات غير صالحة.',
      success: false,
    };
  }

  try {
    const permissionsObject = JSON.parse(validatedFields.data.permissions);

    await prisma.user.update({
      where: { id: userId },
      data: {
        permissions: JSON.stringify(permissionsObject),
      },
    });
    
     await prisma.log.create({
        data: {
            userId: session.user.id,
            action: 'UPDATE',
            entityType: 'USER',
            entityId: userId,
            details: `قام بتحديث صلاحيات المستخدم ID: ${userId}`
        }
    });


    revalidatePath('/users');
    // If the user is updating their own permissions, we should update their session
    if (session.user.id === userId) {
        session.user.permissions = permissionsObject;
        await session.save();
    }

    return { message: 'تم تحديث صلاحيات المستخدم بنجاح!', success: true };
  } catch (error) {
    console.error('Error updating permissions:', error);
    return { message: 'فشل في تحديث الصلاحيات.', success: false };
  }
}

export async function deleteUser(userId: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
        redirect('/login');
    }

    if (!session.user.permissions?.users?.delete) {
        return { message: 'ليس لديك الصلاحية لحذف المستخدمين.', success: false };
    }

    if (session.user.id === userId) {
        return { message: 'لا يمكنك حذف حسابك الخاص.', success: false };
    }

    try {
        const userToDelete = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!userToDelete) {
            return { message: 'المستخدم غير موجود.', success: false };
        }

        if (userToDelete.username === 'admin' || userToDelete.role === 'DEVELOPER') {
            return { message: 'لا يمكن حذف حساب المسؤول الرئيسي أو المطور.', success: false };
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        await prisma.log.create({
            data: {
                userId: session.user.id,
                action: 'DELETE',
                entityType: 'USER',
                entityId: userId,
                details: `قام بحذف المستخدم: ${userToDelete.username}`,
            },
        });

        revalidatePath('/users');
        return { message: 'تم حذف المستخدم بنجاح!', success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        return { message: 'فشل في حذف المستخدم.', success: false };
    }
}


export async function updateUserPassword(prevState: UpdatePasswordState, formData: FormData): Promise<UpdatePasswordState> {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
        redirect('/login');
    }

    const validatedFields = updatePasswordSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        return {
            message: validatedFields.error.flatten().fieldErrors.confirmPassword?.[0] || 'بيانات غير صالحة.',
            success: false,
        };
    }
    
    const { currentPassword, newPassword } = validatedFields.data;

    const user = await prisma.user.findUnique({ where: { id: session.user.id }});

    if (!user || user.password !== currentPassword) {
        return { message: 'كلمة المرور الحالية غير صحيحة.', success: false };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: newPassword } // In a real app, this should be hashed!
        });

        await prisma.log.create({
            data: {
                userId: session.user.id,
                action: 'UPDATE',
                entityType: 'USER',
                entityId: session.user.id,
                details: `قام بتغيير كلمة المرور الخاصة به.`
            }
        });

        return { message: 'تم تغيير كلمة المرور بنجاح!', success: true };

    } catch(error) {
        console.error('Error updating password:', error);
        return { message: 'فشل في تحديث كلمة المرور.', success: false };
    }
}
