import type { Metadata } from 'next';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { getSessionData } from '@/lib/session';
import SessionProvider from '@/components/session-provider';

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionData();

  // Create a plain object to pass to the client component
  const sessionValue = {
    isLoggedIn: session.isLoggedIn,
    user: session.user ?? null,
  };

  return (
    <SessionProvider value={sessionValue}>
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
