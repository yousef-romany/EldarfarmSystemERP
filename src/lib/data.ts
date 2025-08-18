

import type { User, Barn, Livestock, Expense, Sale, Wallet, Vow } from './types';

const adminPermissions = {
  overview: { view: true, add: true, edit: true, delete: true },
  users: { view: true, add: true, edit: true, delete: true },
  barns: { view: true, add: true, edit: true, delete: true },
  purchases: { view: true, add: true, edit: true, delete: true },
  sales: { view: true, add: true, edit: true, delete: true },
  vows: { view: true, add: true, edit: true, delete: true },
  expenses: { view: true, add: true, edit: true, delete: true },
  wallets: { view: true, add: true, edit: true, delete: true },
  settings: { view: true, add: true, edit: true, delete: true },
};

const managerPermissions = {
  overview: { view: true, add: false, edit: false, delete: false },
  users: { view: false, add: false, edit: false, delete: false },
  barns: { view: true, add: true, edit: true, delete: false },
  purchases: { view: true, add: true, edit: true, delete: false },
  sales: { view: true, add: true, edit: true, delete: false },
  vows: { view: true, add: true, edit: true, delete: false },
  expenses: { view: true, add: true, edit: true, delete: false },
  wallets: { view: true, add: false, edit: false, delete: false },
  settings: { view: true, add: false, edit: false, delete: false },
};

const staffPermissions = {
  overview: { view: true, add: false, edit: false, delete: false },
  users: { view: false, add: false, edit: false, delete: false },
  barns: { view: true, add: false, edit: false, delete: false },
  purchases: { view: true, add: true, edit: false, delete: false },
  sales: { view: false, add: false, edit: false, delete: false },
  vows: { view: true, add: true, edit: false, delete: false },
  expenses: { view: true, add: true, edit: false, delete: false },
  wallets: { view: false, add: false, edit: false, delete: false },
  settings: { view: false, add: false, edit: false, delete: false },
};

export const users: User[] = [
  { id: '1', name: 'أحمد محمود', email: 'ahmad@example.com', role: 'Admin', avatar: 'https://placehold.co/40x40.png', permissions: adminPermissions },
  { id: '2', name: 'فاطمة علي', email: 'fatima@example.com', role: 'Manager', avatar: 'https://placehold.co/40x40.png', permissions: managerPermissions },
  { id: '3', name: 'كريم يوسف', email: 'karim@example.com', role: 'Staff', avatar: 'https://placehold.co/40x40.png', permissions: staffPermissions },
  { id: '4', name: 'سارة إبراهيم', email: 'sara@example.com', role: 'Staff', avatar: 'https://placehold.co/40x40.png', permissions: staffPermissions },
];

export const barns: Barn[] = [
  { id: 'b1', name: 'العنبر الشمالي', capacity: 50, currentOccupancy: 45 },
  { id: 'b2', name: 'العنبر الجنوبي', capacity: 50, currentOccupancy: 30 },
  { id: 'b3', name: 'عنبر التسمين', capacity: 75, currentOccupancy: 70 },
  { id: 'b4', name: 'عنبر الحجر الصحي', capacity: 20, currentOccupancy: 5 },
  { id: 'b5', name: 'عنبر الدواجن أ', capacity: 1000, currentOccupancy: 500 },
];

export const livestock: Livestock[] = [
  { id: 'l1', tagId: 'COW-001', type: 'Cow', breed: 'هولشتاين', weight: 550, age: 24, barnId: 'b1', status: 'Available' },
  { id: 'l2', tagId: 'SHP-012', type: 'Sheep', breed: 'عسافي', weight: 80, age: 12, barnId: 'b2', status: 'Available' },
  { id: 'l3', tagId: 'GOT-005', type: 'Goat', breed: 'شامي', weight: 65, age: 18, barnId: 'b2', status: 'Sold' },
  { id: 'l4', tagId: 'COW-002', type: 'Cow', breed: 'براون سويس', weight: 600, age: 30, barnId: 'b1', status: 'Available' },
  { id: 'l5', tagId: 'COW-003', type: 'Cow', breed: 'هولشتاين', weight: 300, age: 10, barnId: 'b3', status: 'Quarantined' },
  { id: 'l6', tagId: 'SHP-015', type: 'Sheep', breed: 'رحماني', weight: 75, age: 11, barnId: 'b2', status: 'Available' },
  { id: 'l7', isBatch: true, type: 'Chicken', breed: 'ساسو', weight: 1.5, age: 2, barnId: 'b5', status: 'Available', quantity: 500 },
  { id: 'l8', tagId: 'COW-008', type: 'Cow', breed: 'هولشتاين', weight: 450, age: 20, barnId: 'b1', status: 'Vowed' },
];

export const expenses: Expense[] = [
  { id: 'e1', date: '2024-05-20', category: 'Feed', amount: 15000, description: 'شراء علف ذرة' },
  { id: 'e2', date: '2024-05-18', category: 'Vet', amount: 2500, description: 'تحصينات دورية' },
  { id: 'e3', date: '2024-05-15', category: 'Maintenance', amount: 3000, description: 'إصلاح سور العنبر الشمالي' },
  { id: 'e4', date: '2024-05-12', category: 'Other', amount: 1200, description: 'فواتير كهرباء ومياه' },
];

export const sales: Sale[] = [
    { id: 's1', animalId: 'l3', customerName: 'شركة النور', saleDate: '2024-05-10', type: 'Immediate', totalPrice: 25000, status: 'Completed', pricePerKg: 384.6, initialWeight: 65, finalWeight: 65, payments: [{walletId: 'w1', amount: 25000, date: '2024-05-10'}] },
    { id: 's2', animalId: 'l2', customerName: 'محمد عبد الله', saleDate: '2024-04-25', settlementDate: '2024-05-25', type: 'Deferred', totalPrice: 8000, deposit: 2000, initialWeight: 60, finalWeight: 80, status: 'Completed', pricePerKg: 133.33, payments: [{walletId: 'w2', amount: 6000, date: '2024-05-25'}] },
    { id: 's3', animalId: 'l4', customerName: 'مزارع الخير', saleDate: '2024-05-20', type: 'Deferred', totalPrice: 90000, deposit: 20000, initialWeight: 600, status: 'Pending', pricePerKg: 150 }
];

export const wallets: Wallet[] = [
  { id: 'w1', name: 'فودافون كاش', balance: 15200.50, icon: 'https://placehold.co/40x40.png' },
  { id: 'w2', name: 'Instapay', balance: 85000.00, icon: 'https://placehold.co/40x40.png' },
  { id: 'w3', name: 'حساب بنكي', balance: 320500.75, icon: 'https://placehold.co/40x40.png' },
  { id: 'w4', name: 'اتصالات كاش', balance: 5000.00, icon: 'https://placehold.co/40x40.png' },
];

export const vows: Vow[] = [
    { id: 'v1', donorName: 'يوسف نادر', receiptId: '2024-00123', date: '2024-05-28', livestockId: 'l8', notes: 'تم الاستلام بحالة صحية ممتازة.'},
];
