'use client';

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
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
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { useState } from 'react';
import { cn } from '@/lib/utils';


export function SidebarNav() {
  const pathname = usePathname();
  const [managementOpen, setManagementOpen] = useState(true);
  const [operationsOpen, setOperationsOpen] = useState(true);

  const managementItems = [
    { href: '/', label: 'نظرة عامة', icon: LayoutGrid },
    { href: '/users', label: 'المستخدمون', icon: Users },
    { href: '/barns', label: 'العنابر', icon: Warehouse },
  ];

  const operationsItems = [
    { href: '/purchases', label: 'المشتريات', icon: ShoppingCart },
    { href: '/sales', label: 'المبيعات', icon: DollarSign },
    { href: '/expenses', label: 'المصروفات', icon: ClipboardList },
  ];

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Beef className="h-8 w-8 text-sidebar-primary" />
          <h1 className="text-xl font-semibold text-white">مدير المواشي</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            <Collapsible open={managementOpen} onOpenChange={setManagementOpen}>
                <CollapsibleTrigger className="w-full">
                    <SidebarMenuButton className="w-full justify-between">
                        <span>الإدارة</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", managementOpen && "rotate-180")} />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                    {managementItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                            <Link href={item.href} className="w-full">
                                <SidebarMenuSubButton isActive={pathname === item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuSubButton>
                            </Link>
                        </SidebarMenuSubItem>
                    ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
            <Collapsible open={operationsOpen} onOpenChange={setOperationsOpen}>
                <CollapsibleTrigger className="w-full">
                    <SidebarMenuButton className="w-full justify-between">
                        <span>العمليات</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", operationsOpen && "rotate-180")} />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                    {operationsItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                            <Link href={item.href} className="w-full">
                                <SidebarMenuSubButton isActive={pathname === item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuSubButton>
                            </Link>
                        </SidebarMenuSubItem>
                    ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
        </SidebarMenu>
      </SidebarContent>
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
