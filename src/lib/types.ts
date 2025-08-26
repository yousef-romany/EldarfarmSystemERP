

// These types are for client-side usage and mock data.
// The source of truth is now prisma/schema.prisma

import type { Session } from "next-auth";

export type Permission = {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  confirm?: boolean; // Added for confirming drafts
};

export type UserPermissions = {
  overview: Permission;
  users: Permission;
  barns: Permission;
  livestockTypes: Permission;
  purchases: Permission;
  pos: Permission;
  deferredSales: Permission;
  sales: Permission;
  vows: Permission;
  contributions: Permission;
  expenses: Permission;
  wallets: Permission;
  settings: Permission;
  reports: Permission;
};

export type User = {
  id: string;
  name: string;
  email?: string; // Made email optional
  role: 'Admin' | 'Manager' | 'Staff';
  avatar: string;
  permissions: UserPermissions;
};

export type Barn = {
  id: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
};

export type Livestock = {
  id: string;
  tagId?: string; // Optional for batches
  type: 'Cow' | 'Sheep' | 'Goat' | 'Chicken'; // This is now a simplified type, real type is linked
  breed: string;
  weight: number; // in kg - for batches, this can be average weight
  age: number; // in months
  barnId: string;
  status: 'Available' | 'Sold' | 'Quarantined' | 'Vowed' | 'PendingSale';
  isBatch?: boolean;
  quantity?: number;
};

export type Payment = {
  id?: string;
  walletId: string;
  amount: number;
  date?: string; // ISO date string
};

export type Expense = {
  id:string;
  date: string; // ISO date string
  category: 'Feed' | 'Vet' | 'Maintenance' | 'Other';
  amount: number;
  description: string;
  payment?: Payment;
};

export type Sale = {
  id: string;
  animalId: string;
  customerName: string;
  saleDate: string; // ISO date string
  settlementDate?: string; // ISO date string for deferred sales
  type: 'Immediate' | 'Deferred';
  pricePerKg: number;
  totalPrice: number;
  payments?: Payment[];
  deposit?: number;
  initialWeight?: number;
  finalWeight?: number;
  status: 'Pending' | 'Completed' | 'Draft';
};

export type Wallet = {
  id: string;
  name: string;
  balance: number;
  icon: string;
};

export type Vow = {
    id: string;
    donorName: string;
    receiptId: string;
    date: string; // ISO date string
    livestockId: string; // The ID of the animal or batch that was vowed
    notes?: string;
}

export type Contribution = {
    id: string;
    donorName: string;
    description: string;
    date: string; // ISO date string
    totalAmount: number;
    payments: Payment[];
}

// Session
export type SessionUser = {
  id: string;
  username: string;
  permissions: UserPermissions;
}
