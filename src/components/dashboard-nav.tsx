'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Wallet,
  Target,
  Settings,
  CircleHelp,
} from 'lucide-react';
import { PennywiseIcon } from './icons';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/transactions', label: 'Transactions', icon: Wallet },
  { href: '/dashboard/budgets', label: 'Budgets', icon: Target },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <>
      <div
        data-sidebar="header"
        className="flex h-14 items-center gap-2 p-2 group-data-[collapsible=icon]:justify-center"
      >
        <Link href="/dashboard" className="flex items-center gap-2 font-headline font-semibold text-primary">
          <PennywiseIcon className="size-8 shrink-0" />
          <span className="duration-200 group-data-[collapsible=icon]:hidden">
            Pennywise
          </span>
        </Link>
      </div>

      <div data-sidebar="content" className="flex-1 overflow-y-auto">
        <SidebarMenu className="p-2">
          {links.map((link) => (
            <SidebarMenuItem key={link.href}>
              <Link href={link.href}>
                <SidebarMenuButton
                  isActive={pathname === link.href}
                  tooltip={{
                    children: link.label,
                  }}
                >
                  <link.icon className="size-5 shrink-0" />
                  {link.label}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>

      <div data-sidebar="footer" className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={{children: 'Help & Support'}}>
              <CircleHelp className="size-5 shrink-0" />
              Help & Support
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </>
  );
}
