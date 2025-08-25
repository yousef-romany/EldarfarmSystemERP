
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
  Gift,
  Coins,
  BookCheck,
  ArchiveRestore,
  FileSpreadsheet,
  Box,
  Repeat,
  List,
} from 'lucide-react';
import Link from 'next/link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useSession } from '../session-provider';


export function SidebarNav() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { user } = useSession();
  
  const [managementOpen, setManagementOpen] = useState(true);
  const [operationsOpen, setOperationsOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(true);


  const managementItems = [
    { href: '/dashboard', label: 'نظرة عامة', icon: LayoutGrid, permission: user?.permissions.overview?.view },
    { href: '/users', label: 'المستخدمون', icon: Users, permission: user?.permissions.users?.view },
    { href: '/barns', label: 'العنابر', icon: Warehouse, permission: user?.permissions.barns?.view },
    { href: '/livestock-types', label: 'أنواع المواشي', icon: Box, permission: user?.permissions.livestockTypes?.view },
  ];

  const operationsItems = [
    { href: '/purchases', label: 'المشتريات', icon: ShoppingCart, permission: user?.permissions.purchases?.view },
    { href: '/sales/pos', label: 'نقطة البيع (فوري)', icon: DollarSign, permission: user?.permissions.pos?.view },
    { href: '/sales/deferred', label: 'مبيعات آجلة', icon: DollarSign, permission: user?.permissions.deferredSales?.view },
    { href: '/sales', label: 'سجل المبيعات', icon: List, permission: user?.permissions.sales?.view },
    { href: '/vows', label: 'النذور الحية', icon: Gift, permission: user?.permissions.vows?.view },
    { href: '/contributions', label: 'المساهمات النقدية', icon: Coins, permission: user?.permissions.contributions?.view },
    { href: '/expenses', label: 'المصروفات', icon: ClipboardList, permission: user?.permissions.expenses?.view },
    { href: '/wallets', label: 'المحافظ', icon: Wallet, permission: user?.permissions.wallets?.view },
  ];
  
  const financialReportsItems = [
    { href: '/daily-report', label: 'التقرير النقدي اليومي', icon: BookCheck, permission: user?.permissions.reports?.view },
    { href: '/settlement', label: 'تسوية اليومية', icon: ArchiveRestore, permission: user?.permissions.reports?.view },
  ];

  const livestockReportsItems = [
      { href: '/reports/livestock-movement', label: 'تقرير حركة المواشي', icon: Repeat, permission: user?.permissions.reports?.view },
      { href: '/reports/available', label: 'المواشي المتاحة', icon: FileSpreadsheet, permission: user?.permissions.reports?.view },
      { href: '/reports/bookings', label: 'تقارير الحجوزات', icon: FileSpreadsheet, permission: user?.permissions.reports?.view },
  ]

  const managementVisible = managementItems.some(item => item.permission);
  const operationsVisible = operationsItems.some(item => item.permission);
  const reportsVisible = [...financialReportsItems, ...livestockReportsItems].some(item => item.permission);

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
            {managementVisible && (
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
                      {managementItems.map((item) => item.permission && (
                          <SidebarMenuSubItem key={item.href}>
                              <Link href={item.href}>
                                  <SidebarMenuSubButton asChild isActive={pathname === item.href} tooltip={item.label}>
                                      <div>
                                          <item.icon />
                                          <span>{item.label}</span>
                                      </div>
                                  </SidebarMenuSubButton>
                              </Link>
                          </SidebarMenuSubItem>
                      ))}
                      </SidebarMenuSub>
                  </CollapsibleContent>
              </Collapsible>
            )}
            {operationsVisible && (
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
                      {operationsItems.map((item) => item.permission && (
                          <SidebarMenuSubItem key={item.href}>
                              <Link href={item.href}>
                                  <SidebarMenuSubButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                                      <div>
                                          <item.icon />
                                          <span>{item.label}</span>
                                      </div>
                                  </SidebarMenuSubButton>
                              </Link>
                          </SidebarMenuSubItem>
                      ))}
                      </SidebarMenuSub>
                  </CollapsibleContent>
              </Collapsible>
            )}
             {reportsVisible && (
              <Collapsible open={reportsOpen} onOpenChange={setReportsOpen} disabled={state === 'collapsed'}>
                  <CollapsibleTrigger className="w-full" asChild>
                      <SidebarMenuButton className="w-full justify-between" tooltip="التقارير">
                          <div className="flex items-center gap-2">
                              <FileSpreadsheet />
                              <span className="truncate">التقارير</span>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden", reportsOpen && "rotate-180")} />
                      </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                      <SidebarMenuSub>
                      {financialReportsItems.map((item) => item.permission && (
                          <SidebarMenuSubItem key={item.href}>
                              <Link href={item.href}>
                                  <SidebarMenuSubButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                                      <div>
                                          <item.icon />
                                          <span>{item.label}</span>
                                      </div>
                                  </SidebarMenuSubButton>
                              </Link>
                          </SidebarMenuSubItem>
                      ))}
                      {livestockReportsItems.map((item) => item.permission && (
                          <SidebarMenuSubItem key={item.href}>
                              <Link href={item.href}>
                                  <SidebarMenuSubButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                                      <div>
                                          <item.icon />
                                          <span>{item.label}</span>
                                      </div>
                                  </SidebarMenuSubButton>
                              </Link>
                          </SidebarMenuSubItem>
                      ))}
                      </SidebarMenuSub>
                  </CollapsibleContent>
              </Collapsible>
             )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          {user?.permissions.settings?.view && (
            <SidebarMenuItem>
              <Link href="/settings" className="w-full">
                <SidebarMenuButton tooltip="الإعدادات">
                  <Settings />
                  <span>الإعدادات</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
             <form action={logout} className='w-full'>
                <SidebarMenuButton tooltip="تسجيل الخروج" asChild>
                    <button type="submit" className='w-full'>
                        <LogOut />
                        <span>تسجيل الخروج</span>
                    </button>
                </SidebarMenuButton>
             </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
