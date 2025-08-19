
'use server';

import { redirect } from 'next/navigation';
import { getSession, sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function login(prevState: string | undefined, formData: FormData) {
  const session = await getSession();

  const { username, password } = Object.fromEntries(formData);

  // This is where you would validate the user's credentials
  const user = await prisma.user.findUnique({
    where: { username: username.toString() },
  });

  if (!user || user.password !== password) {
    return 'اسم المستخدم أو كلمة المرور غير صحيحة.';
  }

  // --- Store user data in session ---
  session.isLoggedIn = true;
  session.username = user.username;
  session.userId = user.id;
  session.permissions = user.permissions as any; // Cast because Prisma returns JsonValue

  await session.save();

  // Redirect to the dashboard after successful login
  return redirect('/dashboard');
}

export async function logout() {
    const session = await getSession();
    session.destroy();
    redirect('/');
}
