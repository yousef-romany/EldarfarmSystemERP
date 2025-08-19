

import type { UserPermissions } from './types';
import type { Prisma } from '@prisma/client'

export const defaultPermissions: UserPermissions = {
  overview: { view: true, add: false, edit: false, delete: false },
  users: { view: false, add: false, edit: false, delete: false },
  barns: { view: true, add: true, edit: true, delete: false },
  livestockTypes: { view: true, add: true, edit: true, delete: false },
  purchases: { view: true, add: true, edit: true, delete: false },
  sales: { view: true, add: true, edit: true, delete: false },
  vows: { view: true, add: true, edit: true, delete: false },
  contributions: { view: true, add: true, edit: true, delete: false },
  expenses: { view: true, add: true, edit: true, delete: false },
  wallets: { view: true, add: false, edit: false, delete: false },
  settings: { view: true, add: false, edit: false, delete: false },
  reports: { view: true, add: false, edit: false, delete: false },
};

export const adminPermissions: UserPermissions = {
  overview: { view: true, add: true, edit: true, delete: true },
  users: { view: true, add: true, edit: true, delete: true },
  barns: { view: true, add: true, edit: true, delete: true },
  livestockTypes: { view: true, add: true, edit: true, delete: true },
  purchases: { view: true, add: true, edit: true, delete: true },
  sales: { view: true, add: true, edit: true, delete: true },
  vows: { view: true, add: true, edit: true, delete: true },
  contributions: { view: true, add: true, edit: true, delete: true },
  expenses: { view: true, add: true, edit: true, delete: true },
  wallets: { view: true, add: true, edit: true, delete: true },
  settings: { view: true, add: true, edit: true, delete: true },
  reports: { view: true, add: true, edit: true, delete: true },
};


// TEMP: Remove mock data that relies on old types
export const users: any[] = [];
export const vows: any[] = [];
export const livestock: any[] = [];
export const expenses: any[] = [];
export const sales: any[] = [];
export const contributions: any[] = [];
export const wallets: any[] = [];
export const barns: any[] = [];
