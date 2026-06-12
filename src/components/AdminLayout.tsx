import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Boxes, LayoutDashboard, LogOut, Menu, ShoppingCart, Tags, Users, Warehouse } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminRoleHint, getAdminRoleLabel, normalizeRole } from '@/lib/adminRoles';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = normalizeRole(user?.role);
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isSales = role === 'sales' || role === 'staff';
  const isWarehouse = role === 'warehouse';
  const navSections = useMemo(
    () =>
      isAdmin || isManager
        ? [
            {
              title: 'Tổng quan',
              items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }]
            },
            {
              title: 'Vận hành',
              items: [
                { to: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart },
                { to: '/admin/products', label: 'Hàng hóa', icon: Boxes },
                { to: '/admin/inventory', label: 'Vận chuyển', icon: Warehouse },
                { to: '/admin/promotions', label: 'Khuyến mãi', icon: Tags },
                { to: '/admin/customers', label: 'Khách hàng', icon: Users }
              ]
            },
            {
              title: 'Quản trị',
              items: [
                { to: '/admin/reporting', label: 'Quản trị', icon: BarChart3 },
                { to: '/admin/orders-audit', label: 'Audit', icon: Tags },
                ...(isAdmin ? [{ to: '/admin/staff', label: 'Quản lý kho', icon: Warehouse }] : [])
              ]
            }
          ]
        : isSales
          ? [
              {
                title: 'Vận hành',
                items: [
                  { to: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart, end: true },
                  { to: '/admin/customers', label: 'Khách hàng', icon: Users }
                ]
              }
            ]
          : isWarehouse
            ? [
                {
                  title: 'Kho hàng',
                  items: [
                    { to: '/admin/products', label: 'Sản phẩm', icon: Boxes, end: true },
                    { to: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart }
                  ]
                }
              ]
        : [
            {
              title: 'Vận hành',
              items: [{ to: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart, end: true }]
            }
          ],
    [isAdmin]
  );

  const roleLabel = getAdminRoleLabel(role);
  const roleHint = getAdminRoleHint(role);
  const quickActions = isAdmin || isManager
    ? [
        { to: '/admin/orders', label: 'Xử lý đơn' },
        { to: '/admin/inventory', label: 'Quản lý tồn kho' },
        { to: '/admin/reporting', label: 'Xem báo cáo' }
      ]
    : isSales
      ? [
          { to: '/admin/orders', label: 'Hàng chờ' },
          { to: '/admin/customers', label: 'Khách hàng' },
          { to: '/', label: 'Về cửa hàng' }
        ]
    : isWarehouse
      ? [
          { to: '/admin/products', label: 'Kiểm kho' },
          { to: '/admin/inventory', label: 'Tồn kho' },
          { to: '/admin/orders', label: 'Đơn cần xử lý' },
          { to: '/', label: 'Về cửa hàng' }
        ]
      : [
        { to: '/admin/orders', label: 'Hàng chờ' },
        { to: '/', label: 'Về cửa hàng' }
      ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,_rgba(2,6,23,0.03),_transparent_24%)]">
      <div className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm transition hover:bg-secondary lg:hidden"
              aria-label="Mở menu quản trị"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">NovaX Admin Workspace</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-black">Bảng điều hành</h1>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  {roleLabel}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{roleHint}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user?.name || 'Admin'}</p>
              <p className="text-xs text-muted-foreground">{user?.email || 'admin@novax.vn'}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-secondary"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto grid gap-6 px-4 py-6 lg:grid-cols-[280px_1fr]">
        <aside className={`lg:sticky lg:top-24 ${mobileMenuOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="rounded-3xl border border-border/70 bg-card/95 p-4 shadow-lg shadow-black/5 backdrop-blur">
            <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Phiên làm việc</p>
              <p className="mt-1 text-lg font-black">{roleLabel}</p>
              <p className="mt-1 text-sm text-muted-foreground">{user?.email || 'admin@novax.vn'}</p>
            </div>

            <nav className="mt-4 space-y-4">
              {navSections.map((section) => (
                <div key={section.title}>
                  <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{section.title}</p>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all ${
                            isActive ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-foreground hover:bg-secondary'
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Lối tắt</p>
                <div className="mt-2 grid gap-2">
                  {quickActions.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-secondary"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                Về trang bán hàng
              </Link>
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
