
export type Permission = {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
};

export type UserPermissions = {
  overview: Permission;
  users: Permission;
  barns: Permission;
  purchases: Permission;
  sales: Permission;
  expenses: Permission;
  wallets: Permission;
  settings: Permission;
};

export type User = {
  id: string;
  name: string;
  email: string;
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
  type: 'Cow' | 'Sheep' | 'Goat' | 'Chicken';
  breed: string;
  weight: number; // in kg - for batches, this can be average weight
  age: number; // in months
  barnId: string;
  status: 'Available' | 'Sold' | 'Quarantined' | 'Vowed';
  isBatch?: boolean;
  quantity?: number;
};

export type Expense = {
  id:string;
  date: string; // ISO date string
  category: 'Feed' | 'Vet' | 'Maintenance' | 'Other';
  amount: number;
  description: string;
};

export type Payment = {
  walletId: string;
  amount: number;
  date?: string; // ISO date string
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
  status: 'Pending' | 'Completed';
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
