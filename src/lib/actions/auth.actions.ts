
'use server';

import { redirect } from 'next/navigation';
import { getFullSession, loginAction, logoutAction } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { UserPermissions } from '../types';

// Define the order of pages to check for redirection after login.
const orderedRedirects: (keyof UserPermissions)[] = [
  'overview',
  'daily-report',
  'purchases',
  'sales',
  'pos',
  'vows',
  'contributions',
  'expenses',
  'barns',
  'wallets',
  'users',
  'livestockTypes',
  'reports',
  'settings',
  'logs',
];

// Map the permission keys to actual URL paths.
const permissionToPathMap: Record<string, string> = {
  overview: '/dashboard',
  users: '/users',
  barns: '/barns',
  livestockTypes: '/livestock-types',
  purchases: '/purchases',
  sales: '/sales',
  pos: '/sales/pos',
  deferredSales: '/sales/deferred',
  vows: '/vows',
  contributions: '/contributions',
  expenses: '/expenses',
  wallets: '/wallets',
  settings: '/settings',
  reports: '/reports',
  logs: '/logs',
  'daily-report': '/daily-report', // Added for mapping
  'settlement': '/settlement', // Added for mapping
};


export async function login(prevState: string | undefined, formData: FormData) {
  const { username, password } = Object.fromEntries(formData);

  // This is where you would validate the user's credentials
  const user = await prisma.user.findUnique({
    where: { username: username.toString() },
  });

  if (!user || user.password !== password) {
    return 'اسم المستخدم أو كلمة المرور غير صحيحة.';
  }

  // --- Store only user ID in session ---
  await loginAction({
      id: user.id,
      username: user.username,
      role: user.role as any,
      permissions: JSON.parse(user.permissions as string)
  });
  
  // --- Smart Redirect Logic ---
  const userPermissions = JSON.parse(user.permissions as string) as UserPermissions;
  const redirectTo = orderedRedirects.find(key => userPermissions[key]?.view) || null;
  const targetPath = redirectTo ? permissionToPathMap[redirectTo] : '/forbidden';

  revalidatePath('/', 'layout');
  redirect(targetPath);
}

export async function logout() {
    await logoutAction();
    revalidatePath('/login'); // Clears the cache for the login page
    redirect('/login');
}
