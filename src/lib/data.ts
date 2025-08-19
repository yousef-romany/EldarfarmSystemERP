

import type { User, Barn, Livestock, Expense, Sale, Wallet, Vow, Contribution } from './types';
import type { User as PrismaUser, Barn as PrismaBarn, Livestock as PrismaLivestock, Payment, Prisma } from '@prisma/client'

const adminPermissions: Prisma.JsonObject = {
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
