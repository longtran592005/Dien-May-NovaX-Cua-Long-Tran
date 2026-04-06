import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { listAdminUsers, updateAdminUserRole, updateAdminUserVerified, type AdminUser } from '@/services/adminApi';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await listAdminUsers({
        q: search,
        role: roleFilter,
        verified: verifiedFilter,
        sortBy,
        page,
        pageSize
      });
      setUsers(data.items);
      setTotal(data.total);
    } catch {
      toast.error('Không tải được danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [page, search, roleFilter, verifiedFilter, sortBy]);

  const changeRole = async (id: string, role: 'customer' | 'admin') => {
    setSavingUserId(id);
    try {
      await updateAdminUserRole(id, role);
      toast.success('Đã cập nhật quyền người dùng');
      await loadUsers();
    } catch {
      toast.error('Không thể cập nhật quyền');
    } finally {
      setSavingUserId(null);
    }
  };

  const toggleVerified = async (user: AdminUser) => {
    setSavingUserId(user.id);
    try {
      await updateAdminUserVerified(user.id, !user.verified);
      toast.success(user.verified ? 'Đã khóa tài khoản' : 'Đã mở tài khoản');
      await loadUsers();
    } catch {
      toast.error('Không thể cập nhật trạng thái tài khoản');
    } finally {
      setSavingUserId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-2xl font-black">Quản lý người dùng</h2>
        <p className="mt-2 text-sm text-muted-foreground">Xem khách hàng, vai trò, xác thực và thời gian tạo tài khoản.</p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold">Danh sách người dùng</h3>
          <button onClick={() => void loadUsers()} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-secondary">
            Làm mới
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Tìm email, tên hoặc id"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          />
          <select
            value={roleFilter}
            onChange={(event) => {
              setPage(1);
              setRoleFilter(event.target.value as 'all' | 'admin' | 'customer');
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="all">Tất cả role</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
          </select>
          <select
            value={verifiedFilter}
            onChange={(event) => {
              setPage(1);
              setVerifiedFilter(event.target.value as 'all' | 'verified' | 'unverified');
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="verified">Đã xác thực</option>
            <option value="unverified">Chưa xác thực</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => {
              setPage(1);
              setSortBy(event.target.value as 'newest' | 'oldest' | 'name');
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="name">Tên A-Z</option>
          </select>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Đang tải...</p>
        ) : (
          <div className="mt-4 space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{user.name || user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Tạo lúc: {new Date(user.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                  <div className="text-right">
                    <select
                      value={user.role}
                      onChange={(event) => void changeRole(user.id, event.target.value as 'customer' | 'admin')}
                      disabled={savingUserId === user.id}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-primary outline-none"
                    >
                      <option value="customer">customer</option>
                      <option value="admin">admin</option>
                    </select>
                    <p className={`mt-2 text-xs font-medium ${user.verified ? 'text-success' : 'text-warning'}`}>
                      {user.verified ? 'Đã xác thực' : 'Chưa xác thực'}
                    </p>
                    <button
                      onClick={() => void toggleVerified(user)}
                      disabled={savingUserId === user.id}
                      className="mt-2 rounded-lg border border-border px-2 py-1 text-xs hover:bg-secondary disabled:opacity-60"
                    >
                      {user.verified ? 'Khóa tài khoản' : 'Mở tài khoản'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!users.length ? <p className="text-sm text-muted-foreground">Không có người dùng phù hợp bộ lọc.</p> : null}

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Trang {page}/{totalPages} · {total} người dùng
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
