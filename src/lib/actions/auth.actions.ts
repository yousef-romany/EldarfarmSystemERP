
'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
  session.user = {
      id: user.id,
      username: user.username,
      permissions: JSON.parse(user.permissions as string)
  };

  await session.save();

  // Redirect to the dashboard after successful login
  return redirect('/dashboard');
}

export async function logout() {
    const session = await getSession();
    session.destroy();
    revalidatePath('/'); // Clears the cache for the login page
    redirect('/');
}
