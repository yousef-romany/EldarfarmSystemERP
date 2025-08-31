
import { redirect } from 'next/navigation';

export default async function RootPage() {
  // The middleware now handles all root redirection logic.
  // This page will likely not be reached, but as a fallback, we redirect to dashboard.
  redirect('/dashboard');
}
