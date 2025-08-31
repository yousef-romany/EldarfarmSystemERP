
// This component is no longer needed as the middleware handles the root redirect.
// We can keep it simple or remove it. For now, redirecting here is a good fallback.
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const session = await getSession();

  if (session.isLoggedIn) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
