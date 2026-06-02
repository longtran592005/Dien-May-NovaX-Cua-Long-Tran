export type AdminWorkspaceRole = 'admin' | 'manager' | 'sales' | 'warehouse' | 'staff';

const ADMIN_WORKSPACE_ROLES: AdminWorkspaceRole[] = ['admin', 'manager', 'sales', 'warehouse', 'staff'];

export function normalizeRole(role?: string | null) {
  return (role || 'customer').toLowerCase();
}

export function hasAdminWorkspaceAccess(role?: string | null) {
  return ADMIN_WORKSPACE_ROLES.includes(normalizeRole(role) as AdminWorkspaceRole);
}

export function getAdminRoleLabel(role?: string | null) {
  switch (normalizeRole(role)) {
    case 'admin':
      return 'Quản lý';
    case 'manager':
      return 'Quản lý';
    case 'sales':
      return 'Bán hàng';
    case 'warehouse':
      return 'Kho';
    case 'staff':
      return 'Vận hành';
    default:
      return 'Khách';
  }
}

export function getAdminHomePath(role?: string | null) {
  switch (normalizeRole(role)) {
    case 'manager':
      return '/admin/reporting';
    case 'sales':
    case 'staff':
      return '/admin/orders';
    case 'warehouse':
      return '/admin/products';
    default:
      return '/admin';
  }
}

export function canAccessAdminRoute(role?: string | null, allowedRoles: readonly string[] = ADMIN_WORKSPACE_ROLES) {
  return allowedRoles.includes(normalizeRole(role));
}

export function getAdminRoleHint(role?: string | null) {
  switch (normalizeRole(role)) {
    case 'admin':
      return 'Toàn quyền điều phối hệ thống';
    case 'manager':
      return 'Theo dõi KPI và ra quyết định';
    case 'sales':
      return 'Xử lý đơn và chăm sóc khách hàng';
    case 'warehouse':
      return 'Tập trung tồn kho và sản phẩm';
    case 'staff':
      return 'Tập trung xử lý đơn hàng đang chờ';
    default:
      return 'Không có quyền truy cập admin';
  }
}
