import { CircleUser, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarNav } from './sidebar-nav';
import Link from 'next/link';
import { SidebarTrigger } from '../ui/sidebar';

export function Header() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-2">
            <Sheet>
                <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">فتح قائمة التنقل</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="right" className="flex flex-col p-0 bg-sidebar text-sidebar-foreground">
                <SidebarNav />
                </SheetContent>
            </Sheet>
            <SidebarTrigger className="hidden md:flex" />
        </div>
      <div className="w-full flex-1">
        {/* Can add search bar here if needed */}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">فتح قائمة المستخدم</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>حسابي</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>الإعدادات</DropdownMenuItem>
          <DropdownMenuItem>الدعم</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
             <Link href="/">تسجيل الخروج</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
