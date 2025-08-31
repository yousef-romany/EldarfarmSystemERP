

import type { UserPermissions } from './types';
import type { Prisma } from '@prisma/client'

const allPermissions: Permission = { view: true, add: true, edit: true, delete: true, confirm: true };
const noPermissions: Permission = { view: false, add: false, edit: false, delete: false, confirm: false };

export const developerPermissions: UserPermissions = {
  overview: allPermissions,
  users: allPermissions,
  barns: allPermissions,
  livestock: allPermissions,
  livestockTypes: allPermissions,
  purchases: allPermissions,
  sales: allPermissions,
  pos: allPermissions,
  deferredSales: allPermissions,
  vows: allPermissions,
  contributions: allPermissions,
  expenses: allPermissions,
  wallets: allPermissions,
  settings: allPermissions,
  reports: allPermissions,
  logs: allPermissions,
};

export const adminPermissions: UserPermissions = {
  overview: { view: true, add: false, edit: false, delete: false, confirm: false },
  users: { view: true, add: true, edit: true, delete: true, confirm: false }, // Cannot delete developers
  barns: { view: true, add: true, edit: true, delete: true, confirm: true },
  livestock: { view: true, add: true, edit: true, delete: true, confirm: false },
  livestockTypes: { view: true, add: true, edit: true, delete: true, confirm: true },
  purchases: { view: true, add: true, edit: true, delete: true, confirm: true },
  sales: { view: true, add: true, edit: true, delete: true, confirm: true },
  pos: { view: true, add: true, edit: true, delete: true, confirm: true },
  deferredSales: { view: true, add: true, edit: true, delete: true, confirm: true },
  vows: { view: true, add: true, edit: true, delete: true, confirm: true },
  contributions: { view: true, add: true, edit: true, delete: true, confirm: true },
  expenses: { view: true, add: true, edit: true, delete: true, confirm: true },
  wallets: { view: true, add: true, edit: true, delete: true, confirm: true },
  settings: { view: true, add: false, edit: false, delete: false, confirm: false },
  reports: { view: true, add: false, edit: false, delete: false, confirm: true }, // Added confirm for settlement
  logs: { view: false, add: false, edit: false, delete: false, confirm: false }, // Only developers can see logs
};

export const managerPermissions: UserPermissions = {
  overview: { view: true, add: false, edit: false, delete: false, confirm: false },
  users: { view: true, add: true, edit: true, delete: false, confirm: false },
  barns: { view: true, add: true, edit: true, delete: true, confirm: false },
  livestock: { view: true, add: true, edit: true, delete: true, confirm: false },
  livestockTypes: { view: true, add: true, edit: true, delete: true, confirm: false },
  purchases: { view: true, add: true, edit: true, delete: true, confirm: true },
  sales: { view: true, add: true, edit: true, delete: true, confirm: true },
  pos: { view: true, add: true, edit: true, delete: true, confirm: true },
  deferredSales: { view: true, add: true, edit: true, delete: true, confirm: true },
  vows: { view: true, add: true, edit: true, delete: true, confirm: false },
  contributions: { view: true, add: true, edit: true, delete: true, confirm: false },
  expenses: { view: true, add: true, edit: true, delete: true, confirm: false },
  wallets: { view: true, add: true, edit: false, delete: false, confirm: false },
  settings: { view: true, add: false, edit: false, delete: false, confirm: false },
  reports: { view: true, add: false, edit: false, delete: false, confirm: true }, // Added confirm for settlement
  logs: noPermissions,
};

export const staffPermissions: UserPermissions = {
  overview: { view: true, add: false, edit: false, delete: false, confirm: false },
  users: { view: false, add: false, edit: false, delete: false, confirm: false },
  barns: { view: true, add: true, edit: false, delete: false, confirm: false },
  livestock: { view: true, add: false, edit: false, delete: false, confirm: false },
  livestockTypes: { view: true, add: true, edit: false, delete: false, confirm: false },
  purchases: { view: true, add: true, edit: false, delete: false, confirm: false }, // Can create drafts
  sales: { view: true, add: false, edit: false, delete: false, confirm: false },
  pos: { view: true, add: true, edit: false, delete: false, confirm: false }, // Can create drafts
  deferredSales: { view: true, add: true, edit: false, delete: false, confirm: false }, // Can create drafts
  vows: { view: true, add: true, edit: false, delete: false, confirm: false },
  contributions: { view: true, add: true, edit: false, delete: false, confirm: false },
  expenses: { view: true, add: true, edit: false, delete: false, confirm: false },
  wallets: { view: true, add: false, edit: false, delete: false, confirm: false },
  settings: { view: true, add: false, edit: false, delete: false, confirm: false },
  reports: { view: true, add: false, edit: false, delete: false, confirm: false },
  logs: noPermissions,
};

export const defaultPermissions = staffPermissions;

// TEMP: Remove mock data that relies on old types
export const users: any[] = [];
export const vows: any[] = [];
export const livestock: any[] = [];
export const expenses: any[] = [];
export const sales: any[] = [];
export const contributions: any[] = [];
export const wallets: any[] = [];
export const barns: any[] = [];
