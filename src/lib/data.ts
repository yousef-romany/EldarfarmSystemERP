import type { User, Barn, Livestock, Expense, Sale } from './types';

export const users: User[] = [
  { id: '1', name: 'أحمد محمود', email: 'ahmad@example.com', role: 'Admin', avatar: 'https://placehold.co/40x40.png' },
  { id: '2', name: 'فاطمة علي', email: 'fatima@example.com', role: 'Manager', avatar: 'https://placehold.co/40x40.png' },
  { id: '3', name: 'كريم يوسف', email: 'karim@example.com', role: 'Staff', avatar: 'https://placehold.co/40x40.png' },
  { id: '4', name: 'سارة إبراهيم', email: 'sara@example.com', role: 'Staff', avatar: 'https://placehold.co/40x40.png' },
];

export const barns: Barn[] = [
  { id: 'b1', name: 'العنبر الشمالي', capacity: 50, currentOccupancy: 45 },
  { id: 'b2', name: 'العنبر الجنوبي', capacity: 50, currentOccupancy: 30 },
  { id: 'b3', name: 'عنبر التسمين', capacity: 75, currentOccupancy: 70 },
  { id: 'b4', name: 'عنبر الحجر الصحي', capacity: 20, currentOccupancy: 5 },
];

export const livestock: Livestock[] = [
  { id: 'l1', tagId: 'COW-001', type: 'Cow', breed: 'هولشتاين', weight: 550, age: 24, barnId: 'b1', status: 'Available' },
  { id: 'l2', tagId: 'SHP-012', type: 'Sheep', breed: 'عسافي', weight: 80, age: 12, barnId: 'b2', status: 'Available' },
  { id: 'l3', tagId: 'GOT-005', type: 'Goat', breed: 'شامي', weight: 65, age: 18, barnId: 'b2', status: 'Sold' },
  { id: 'l4', tagId: 'COW-002', type: 'Cow', breed: 'براون سويس', weight: 600, age: 30, barnId: 'b1', status: 'Available' },
  { id: 'l5', tagId: 'COW-003', type: 'Cow', breed: 'هولشتاين', weight: 300, age: 10, barnId: 'b3', status: 'Quarantined' },
  { id: 'l6', tagId: 'SHP-015', type: 'Sheep', breed: 'رحماني', weight: 75, age: 11, barnId: 'b2', status: 'Available' },
];

export const expenses: Expense[] = [
  { id: 'e1', date: '2024-05-20', category: 'Feed', amount: 15000, description: 'شراء علف ذرة' },
  { id: 'e2', date: '2024-05-18', category: 'Vet', amount: 2500, description: 'تحصينات دورية' },
  { id: 'e3', date: '2024-05-15', category: 'Maintenance', amount: 3000, description: 'إصلاح سور العنبر الشمالي' },
  { id: 'e4', date: '2024-05-12', category: 'Other', amount: 1200, description: 'فواتير كهرباء ومياه' },
];

export const sales: Sale[] = [
    { id: 's1', animalId: 'l3', customerName: 'شركة النور', saleDate: '2024-05-10', type: 'Immediate', totalPrice: 25000, status: 'Completed' },
    { id: 's2', animalId: 'l2', customerName: 'محمد عبد الله', saleDate: '2024-04-25', type: 'Deferred', totalPrice: 8000, deposit: 2000, initialWeight: 60, status: 'Pending' }
];
