
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminPermissions, defaultPermissions } from '@/lib/data';
import { Prisma } from '@prisma/client';

const UserRole = z.enum(['ADMIN', 'MANAGER', 'STAFF']);

const createUserSchema = z.object({
  username: z.string().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  role: UserRole,
});

const updateUserPermissionsSchema = z.object({
  permissions: z.string(), // We'll receive it as a stringified JSON
});


type UserState = {
  errors?: z.ZodError<typeof createUserSchema>['formErrors']['fieldErrors'];
  message?: string | null;
  success?: boolean;
}

export async function createUser(prevState: UserState, formData: FormData): Promise<UserState> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId || session.permissions?.users?.add !== true) {
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
  const permissions = role === 'ADMIN' ? adminPermissions : defaultPermissions;

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
            userId: session.userId,
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

export async function updateUserPermissions(userId: string, formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId || session.permissions?.users?.edit !== true) {
    return { message: 'ليس لديك الصلاحية لتعديل الصلاحيات.', success: false };
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
            userId: session.userId,
            action: 'UPDATE',
            entityType: 'USER',
            entityId: userId,
            details: `قام بتحديث صلاحيات المستخدم ID: ${userId}`
        }
    });


    revalidatePath('/users');
    // If the user is updating their own permissions, we should update their session
    if (session.userId === userId) {
        session.permissions = permissionsObject;
        await session.save();
    }

    return { message: 'تم تحديث صلاحيات المستخدم بنجاح!', success: true };
  } catch (error) {
    console.error('Error updating permissions:', error);
    return { message: 'فشل في تحديث الصلاحيات.', success: false };
  }
}
