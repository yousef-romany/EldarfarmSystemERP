

import type { User, Barn, Livestock, Expense, Sale, Wallet, Vow, Contribution } from './types';
import type { User as PrismaUser, Barn as PrismaBarn, Livestock as PrismaLivestock } from '@prisma/client'

const adminPermissions = {
  view: true, add: true, edit: true, delete: true 
};

export const users: PrismaUser[] = [
  { id: 'clx1', username: 'admin', password: 'password', role: 'ADMIN', permissions: {
      barns: adminPermissions,
      users: adminPermissions,
      // Add all other entities
  } },
  { id: 'clx2', username: 'manager', password: 'password', role: 'MANAGER', permissions: {
       barns: { view: true, add: true, edit: true, delete: false },
       users: { view: true, add: false, edit: false, delete: false },
  } },
];

export const barns: PrismaBarn[] = [
  { id: 'b1', name: 'العنبر الشمالي', capacity: 50, currentOccupancy: 45 },
  { id: 'b2', name: 'العنبر الجنوبي', capacity: 50, currentOccupancy: 30 },
  { id: 'b3', name: 'عنبر التسمين', capacity: 75, currentOccupancy: 70 },
  { id: 'b4', name: 'عنبر الحجر الصحي', capacity: 20, currentOccupancy: 5 },
  { id: 'b5', name: 'عنبر الدواجن أ', capacity: 1000, currentOccupancy: 500 },
];

// export const livestock: Livestock[] = [
//   { id: 'l1', tagId: 'COW-001', type: 'Cow', breed: 'هولشتاين', weight: 550, age: 24, barnId: 'b1', status: 'Available' },
//   { id: 'l2', tagId: 'SHP-012', type: 'Sheep', breed: 'عسافي', weight: 80, age: 12, barnId: 'b2', status: 'Available' },
//   { id: 'l3', tagId: 'GOT-005', type: 'Goat', breed: 'شامي', weight: 65, age: 18, barnId: 'b2', status: 'Sold' },
//   { id: 'l4', tagId: 'COW-002', type: 'Cow', breed: 'براون سويس', weight: 600, age: 30, barnId: 'b1', status: 'Available' },
//   { id: 'l5', tagId: 'COW-003', type: 'Cow', breed: 'هولشتاين', weight: 300, age: 10, barnId: 'b3', status: 'Quarantined' },
//   { id: 'l6', tagId: 'SHP-015', type: 'Sheep', breed: 'رحماني', weight: 75, age: 11, barnId: 'b2', status: 'Available' },
//   { id: 'l7', isBatch: true, type: 'Chicken', breed: 'ساسو', weight: 1.5, age: 2, barnId: 'b5', status: 'Available', quantity: 500 },
//   { id: 'l8', tagId: 'COW-008', type: 'Cow', breed: 'هولشتاين', weight: 450, age: 20, barnId: 'b1', status: 'Vowed' },
// ];

export const expenses: Expense[] = [
  { id: 'e1', date: '2024-05-20', category: 'Feed', amount: 15000, description: 'شراء علف ذرة', payment: { walletId: 'w3', amount: 15000 } },
  { id: 'e2', date: '2024-05-18', category: 'Vet', amount: 2500, description: 'تحصينات دورية', payment: { walletId: 'w5', amount: 2500 } },
  { id: 'e3', date: '2024-05-15', category: 'Maintenance', amount: 3000, description: 'إصلاح سور العنبر الشمالي', payment: { walletId: 'w5', amount: 3000 } },
  { id: 'e4', date: '2024-05-12', category: 'Other', amount: 1200, description: 'فواتير كهرباء ومياه', payment: { walletId: 'w1', amount: 1200 } },
];

export const sales: Sale[] = [
    { id: 's1', animalId: 'l3', customerName: 'شركة النور', saleDate: '2024-05-10', type: 'Immediate', totalPrice: 25000, status: 'Completed', pricePerKg: 384.6, initialWeight: 65, finalWeight: 65, payments: [{walletId: 'w1', amount: 25000, date: '2024-05-10'}] },
    { id: 's2', animalId: 'l2', customerName: 'محمد عبد الله', saleDate: '2024-04-25', settlementDate: '2024-05-25', type: 'Deferred', totalPrice: 8000, deposit: 2000, initialWeight: 60, finalWeight: 80, status: 'Completed', pricePerKg: 133.33, payments: [{walletId: 'w2', amount: 6000, date: '2024-05-25'}] },
    { id: 's3', animalId: 'l4', customerName: 'مزارع الخير', saleDate: '2024-05-20', type: 'Deferred', totalPrice: 90000, deposit: 20000, initialWeight: 600, status: 'Pending', pricePerKg: 150 }
];

export const wallets: Wallet[] = [
  { id: 'w5', name: 'الخزينة النقدية', balance: 12530.00, icon: 'https://placehold.co/40x40.png' },
  { id: 'w1', name: 'فودافون كاش', balance: 15200.50, icon: 'https://placehold.co/40x40.png' },
  { id: 'w2', name: 'Instapay', balance: 85000.00, icon: 'https://placehold.co/40x40.png' },
  { id: 'w3', name: 'حساب بنكي', balance: 320500.75, icon: 'https://placehold.co/40x40.png' },
  { id: 'w4', name: 'اتصالات كاش', balance: 5000.00, icon: 'https://placehold.co/40x40.png' },
];

// export const vows: Vow[] = [
//     { id: 'v1', donorName: 'يوسف نادر', receiptId: '2024-00123', date: '2024-05-28', livestockId: 'l8', notes: 'تم الاستلام بحالة صحية ممتازة.'},
// ];

export const contributions: Contribution[] = [
  { id: 'c1', donorName: 'يوسف رومانى', description: 'نذر بقيمة خروف', date: '2024-05-29', totalAmount: 12000, payments: [
    { walletId: 'w1', amount: 8000 },
    { walletId: 'w2', amount: 4000 }
  ]},
  { id: 'c2', donorName: 'فاعل خير', description: 'تبرع عام', date: '2024-05-27', totalAmount: 5000, payments: [
    { walletId: 'w3', amount: 5000 }
  ]},
];

// TEMP: Remove mock data that relies on old types
export const vows: any[] = [];
export const livestock: any[] = [];
