
import type { Metadata } from 'next';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { getFullSession } from '@/lib/session';
import SessionProvider from '@/components/session-provider';
import { redirect } from 'next/navigation';

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getFullSession();

  // This is a server-side check. If the session is invalid, redirect.
  // This layout is for protected routes, so if isLoggedIn is false,
  // we must redirect to the login page.
  if (!session.isLoggedIn) {
    redirect('/login');
  }

  return (
    <SessionProvider value={session}>
      <SidebarProvider>
          <Sidebar side="right" collapsible="icon">
          <SidebarNav />
          </Sidebar>
          <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-6">{children}</main>
          </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
