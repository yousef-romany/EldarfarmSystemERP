'use client';

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
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
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { useState } from 'react';
import { cn } from '@/lib/utils';


export function SidebarNav() {
  const pathname = usePathname();
  const { state } = useSidebar();
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
    { href: '/wallets', label: 'المحافظ', icon: Wallet },
  ];

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 overflow-hidden">
          <Beef className="h-8 w-8 text-sidebar-primary flex-shrink-0" />
          <div className="flex flex-col transition-all duration-200 ease-in-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
             <h1 className="text-xl font-semibold text-white truncate">مدير المواشي</h1>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            <Collapsible open={managementOpen} onOpenChange={setManagementOpen} disabled={state === 'collapsed'}>
                <CollapsibleTrigger className="w-full" asChild>
                    <SidebarMenuButton className="w-full justify-between" tooltip="الإدارة">
                        <div className="flex items-center gap-2">
                            <Users />
                            <span className="truncate">الإدارة</span>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden", managementOpen && "rotate-180")} />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                    {managementItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                            <Link href={item.href} className="w-full">
                                <SidebarMenuSubButton isActive={pathname === item.href} tooltip={item.label}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuSubButton>
                            </Link>
                        </SidebarMenuSubItem>
                    ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
            <Collapsible open={operationsOpen} onOpenChange={setOperationsOpen} disabled={state === 'collapsed'}>
                <CollapsibleTrigger className="w-full" asChild>
                     <SidebarMenuButton className="w-full justify-between" tooltip="العمليات">
                        <div className="flex items-center gap-2">
                            <ClipboardList />
                            <span className="truncate">العمليات</span>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden", operationsOpen && "rotate-180")} />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                    {operationsItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                            <Link href={item.href} className="w-full">
                                <SidebarMenuSubButton isActive={pathname === item.href} tooltip={item.label}>
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
