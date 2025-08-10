'use client';

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Users,
  Warehouse,
  ShoppingCart,
  DollarSign,
  ClipboardList,
  Settings,
  LogOut,
  Beef,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

const menuItems = [
  { href: '/', label: 'نظرة عامة', icon: LayoutGrid },
  { href: '/users', label: 'المستخدمون', icon: Users },
  { href: '/barns', label: 'العنابر', icon: Warehouse },
  { href: '/purchases', label: 'المشتريات', icon: ShoppingCart },
  { href: '/sales', label: 'المبيعات', icon: DollarSign },
  { href: '/expenses', label: 'المصروفات', icon: ClipboardList },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Beef className="h-8 w-8 text-sidebar-primary" />
          <h1 className="text-xl font-semibold text-white">مدير المواشي</h1>
        </div>
      </SidebarHeader>
      <SidebarMenu className="flex-1">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} className="w-full">
              <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="الإعدادات">
              <Settings />
              <span>الإعدادات</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/login" className="w-full">
              <SidebarMenuButton tooltip="تسجيل الخروج">
                <LogOut />
                <span>تسجيل الخروج</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
