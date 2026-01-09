import type { UserPermissions, Permission, SessionUser } from './types';

// Default permissions for each role
export const DEFAULT_PERMISSIONS: Record<SessionUser['role'], UserPermissions> = {
  DEVELOPER: {
    overview: { view: true, add: true, edit: true, delete: true },
    users: { view: true, add: true, edit: true, delete: true },
    barns: { view: true, add: true, edit: true, delete: true },
    livestock: { view: true, add: true, edit: true, delete: true },
    livestockTypes: { view: true, add: true, edit: true, delete: true },
    purchases: { view: true, add: true, edit: true, delete: true, confirm: true },
    pos: { view: true, add: true, edit: true, delete: true },
    deferredSales: { view: true, add: true, edit: true, delete: true },
    sales: { view: true, add: true, edit: true, delete: true },
    vows: { view: true, add: true, edit: true, delete: true },
    contributions: { view: true, add: true, edit: true, delete: true },
    expenses: { view: true, add: true, edit: true, delete: true },
    wallets: { view: true, add: true, edit: true, delete: true },
    settings: { view: true, add: true, edit: true, delete: true },
    reports: { view: true, add: true, edit: true, delete: true },
    logs: { view: true, add: true, edit: true, delete: true },
    'daily-report': { view: true, add: true, edit: true, delete: true },
    'settlement': { view: true, add: true, edit: true, delete: true },
  },
  ADMIN: {
    overview: { view: true, add: true, edit: true, delete: true },
    users: { view: true, add: true, edit: true, delete: true },
    barns: { view: true, add: true, edit: true, delete: true },
    livestock: { view: true, add: true, edit: true, delete: true },
    livestockTypes: { view: true, add: true, edit: true, delete: true },
    purchases: { view: true, add: true, edit: true, delete: true, confirm: true },
    pos: { view: true, add: true, edit: true, delete: true },
    deferredSales: { view: true, add: true, edit: true, delete: true },
    sales: { view: true, add: true, edit: true, delete: true },
    vows: { view: true, add: true, edit: true, delete: true },
    contributions: { view: true, add: true, edit: true, delete: true },
    expenses: { view: true, add: true, edit: true, delete: true },
    wallets: { view: true, add: true, edit: true, delete: true },
    settings: { view: true, add: true, edit: true, delete: true },
    reports: { view: true, add: true, edit: true, delete: true },
    logs: { view: true, add: true, edit: true, delete: true },
    'daily-report': { view: true, add: true, edit: true, delete: true },
    'settlement': { view: true, add: true, edit: true, delete: true },
  },
  MANAGER: {
    overview: { view: true, add: false, edit: false, delete: false },
    users: { view: true, add: false, edit: false, delete: false },
    barns: { view: true, add: true, edit: true, delete: false },
    livestock: { view: true, add: true, edit: true, delete: false },
    livestockTypes: { view: true, add: true, edit: true, delete: false },
    purchases: { view: true, add: true, edit: true, delete: false, confirm: true },
    pos: { view: true, add: true, edit: true, delete: false },
    deferredSales: { view: true, add: true, edit: true, delete: false },
    sales: { view: true, add: true, edit: true, delete: false },
    vows: { view: true, add: true, edit: true, delete: false },
    contributions: { view: true, add: true, edit: true, delete: false },
    expenses: { view: true, add: true, edit: true, delete: false },
    wallets: { view: true, add: true, edit: true, delete: false },
    settings: { view: true, add: false, edit: false, delete: false },
    reports: { view: true, add: false, edit: false, delete: false },
    logs: { view: true, add: false, edit: false, delete: false },
    'daily-report': { view: true, add: false, edit: false, delete: false },
    'settlement': { view: true, add: true, edit: false, delete: false },
  },
  STAFF: {
    overview: { view: true, add: false, edit: false, delete: false },
    users: { view: false, add: false, edit: false, delete: false },
    barns: { view: true, add: false, edit: false, delete: false },
    livestock: { view: true, add: true, edit: true, delete: false },
    livestockTypes: { view: true, add: false, edit: false, delete: false },
    purchases: { view: true, add: false, edit: false, delete: false, confirm: false },
    pos: { view: true, add: true, edit: true, delete: false },
    deferredSales: { view: true, add: true, edit: true, delete: false },
    sales: { view: true, add: true, edit: true, delete: false },
    vows: { view: true, add: true, edit: true, delete: false },
    contributions: { view: true, add: true, edit: true, delete: false },
    expenses: { view: true, add: true, edit: true, delete: false },
    wallets: { view: true, add: false, edit: false, delete: false },
    settings: { view: false, add: false, edit: false, delete: false },
    reports: { view: true, add: false, edit: false, delete: false },
    logs: { view: false, add: false, edit: false, delete: false },
    'daily-report': { view: true, add: false, edit: false, delete: false },
    'settlement': { view: true, add: false, edit: false, delete: false },
  },
};

// Helper function to check if user has specific permission
export function hasPermission(
  user: SessionUser | null,
  resource: keyof UserPermissions,
  action: keyof Permission
): boolean {
  if (!user) return false;
  
  const userPermissions = user.permissions || DEFAULT_PERMISSIONS[user.role];
  const resourcePermissions = userPermissions[resource];
  
  if (!resourcePermissions) return false;
  
  return resourcePermissions[action] === true;
}

// Helper function to check if user can view a resource
export function canView(user: SessionUser | null, resource: keyof UserPermissions): boolean {
  return hasPermission(user, resource, 'view');
}

// Helper function to check if user can add a resource
export function canAdd(user: SessionUser | null, resource: keyof UserPermissions): boolean {
  return hasPermission(user, resource, 'add');
}

// Helper function to check if user can edit a resource
export function canEdit(user: SessionUser | null, resource: keyof UserPermissions): boolean {
  return hasPermission(user, resource, 'edit');
}

// Helper function to check if user can delete a resource
export function canDelete(user: SessionUser | null, resource: keyof UserPermissions): boolean {
  return hasPermission(user, resource, 'delete');
}

// Helper function to check if user can confirm a draft
export function canConfirm(user: SessionUser | null, resource: keyof UserPermissions): boolean {
  if (!user) return false;
  
  const userPermissions = user.permissions || DEFAULT_PERMISSIONS[user.role];
  const resourcePermissions = userPermissions[resource];
  
  if (!resourcePermissions) return false;
  
  return resourcePermissions.confirm === true;
}

// Helper function to get default permissions for a role
export function getDefaultPermissions(role: SessionUser['role']): UserPermissions {
  return JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS[role]));
}

// Helper function to merge custom permissions with default
export function mergePermissions(
  role: SessionUser['role'],
  customPermissions?: Partial<UserPermissions>
): UserPermissions {
  const defaults = getDefaultPermissions(role);
  
  if (!customPermissions) return defaults;
  
  return {
    ...defaults,
    ...customPermissions,
  };
}

// Helper function to check if user has any admin-like role
export function isAdmin(user: SessionUser | null): boolean {
  if (!user) return false;
  return user.role === 'DEVELOPER' || user.role === 'ADMIN';
}

// Helper function to check if user is manager or higher
export function isManagerOrHigher(user: SessionUser | null): boolean {
  if (!user) return false;
  return user.role === 'DEVELOPER' || user.role === 'ADMIN' || user.role === 'MANAGER';
}

// Helper function to get role display name in Arabic
export function getRoleDisplayName(role: SessionUser['role']): string {
  switch (role) {
    case 'DEVELOPER': return 'مطور';
    case 'ADMIN': return 'مدير عام';
    case 'MANAGER': return 'مدير';
    case 'STAFF': return 'موظف';
    default: return role;
  }
}

// Helper function to get all available roles
export function getAvailableRoles(): Array<{ value: SessionUser['role']; label: string }> {
  return [
    { value: 'DEVELOPER', label: 'مطور' },
    { value: 'ADMIN', label: 'مدير عام' },
    { value: 'MANAGER', label: 'مدير' },
    { value: 'STAFF', label: 'موظف' },
  ];
}

// Helper function to get resource display name in Arabic
export function getResourceDisplayName(resource: keyof UserPermissions): string {
  const resourceNames: Record<keyof UserPermissions, string> = {
    overview: 'لوحة التحكم',
    users: 'المستخدمين',
    barns: 'العنابر',
    livestock: 'المواشي',
    livestockTypes: 'أنواع المواشي',
    purchases: 'المشتريات',
    pos: 'نقاط البيع',
    deferredSales: 'المبيعات الآجلة',
    sales: 'المبيعات',
    vows: 'النذور',
    contributions: 'التبرعات',
    expenses: 'المصروفات',
    wallets: 'المحافظ',
    settings: 'الإعدادات',
    reports: 'التقارير',
    logs: 'السجلات',
    'daily-report': 'التقرير اليومي',
    'settlement': 'التسويات',
  };
  
  return resourceNames[resource] || resource;
}

// Helper function to get action display name in Arabic
export function getActionDisplayName(action: keyof Permission): string {
  const actionNames: Record<keyof Permission, string> = {
    view: 'عرض',
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    confirm: 'تأكيد',
  };
  
  return actionNames[action] || action;
}
