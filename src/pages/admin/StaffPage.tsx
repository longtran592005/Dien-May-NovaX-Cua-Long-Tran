import { FormEvent, useEffect, useMemo, useState } from 'react';
import { RefreshCw, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  createAdminStaff,
  listAdminStaff,
  updateAdminStaffVerified,
  type AdminUser
} from '@/services/adminApi';

const roleLabels: Record<string, string> = {
  admin: 'Quản trị hệ thống',
  manager: 'Quản lý',
  sales: 'Bán hàng',
  warehouse: 'Kho',
  staff: 'Vận hành'
};

const roleOptions = [
  { value: 'staff', label: 'Vận hành / Staff' },
  { value: 'sales', label: 'Bán hàng' },
  { value: 'warehouse', label: 'Kho' },
  { value: 'manager', label: 'Quản lý' }
] as const;

export default function AdminStaffPage() {
  const [staffUsers, setStaffUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [role, setRole] = useState<(typeof roleOptions)[number]['value']>('staff');

  const summary = useMemo(() => {
    return {
      total: total,
      verified: staffUsers.filter((user) => user.verified).length,
      pending: staffUsers.filter((user) => !user.verified).length
    };
  }, [staffUsers, total]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await listAdminStaff({
        q: search,
        verified: verifiedFilter,
        sortBy,
        page,
        pageSize
      });
      setStaffUsers(data.items);
      setTotal(data.total);
    } catch {
      toast.error('Khong tai duoc danh sach nhan vien');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStaff();
  }, [page, search, verifiedFilter, sortBy]);

  const handleCreateStaff = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      await createAdminStaff({
        email: email.trim(),
        fullName: fullName.trim(),
        tempPassword,
        role
      });
      toast.success('Da tao tai khoan nhan vien moi');
      setEmail('');
      setFullName('');
      setTempPassword('');
      setRole('staff');
      setPage(1);
      await loadStaff();
    } catch {
      toast.error('Khong tao duoc nhan vien');
    } finally {
      setCreating(false);
    }
  };

  const toggleVerified = async (user: AdminUser) => {
    setSavingUserId(user.id);
    try {
      await updateAdminStaffVerified(user.id, !user.verified);
      toast.success(user.verified ? 'Da khoa tai khoan nhan vien' : 'Da mo tai khoan nhan vien');
      await loadStaff();
    } catch {
      toast.error('Khong the cap nhat trang thai tai khoan nhan vien');
    } finally {
      setSavingUserId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">Nhân sự & quyền truy cập</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Quản lý nhân viên</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Tạo tài khoản staff, xác thực truy cập và khóa/mở tài khoản trong một luồng rõ ràng, giảm thao tác rời rạc.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => void loadStaff()} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5">
                <RefreshCw className="h-4 w-4" />
                Làm mới
              </button>
              <button type="button" onClick={() => setPage(1)} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary">
                <Users className="h-4 w-4" />
                Về đầu danh sách
              </button>
            </div>
          </div>

          <div className="border-t border-border/70 bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-slate-50 lg:border-l lg:border-t-0 lg:p-8">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-300" />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Tổng quan truy cập</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Tổng staff</p>
                <p className="mt-2 text-2xl font-black text-white">{summary.total}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Đã xác thực</p>
                <p className="mt-2 text-2xl font-black text-white">{summary.verified}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Chưa xác thực</p>
                <p className="mt-2 text-2xl font-black text-white">{summary.pending}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleCreateStaff} className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Tạo tài khoản nhân viên</h3>
            <p className="text-sm text-muted-foreground">Nhập email, tên và mật khẩu tạm thời cho staff mới.</p>
          </div>
          <div className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
            Vai trò mặc định: staff
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            placeholder="Email nhân viên"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            placeholder="Họ và tên"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as (typeof roleOptions)[number]['value'])}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            value={tempPassword}
            onChange={(event) => setTempPassword(event.target.value)}
            required
            minLength={6}
            placeholder="Mật khẩu tạm"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {creating ? 'Đang tạo...' : 'Tạo nhân viên'}
          </button>
        </div>
      </form>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Danh sách nhân viên</h3>
            <p className="text-sm text-muted-foreground">Tìm kiếm, lọc trạng thái xác thực và kích hoạt/tạm khóa tài khoản.</p>
          </div>
          <button onClick={() => void loadStaff()} className="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-secondary">
            Làm mới
          </button>
        </div>

        <div className="mt-4 grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3 md:grid-cols-3">
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
            {staffUsers.map((user) => (
              <div key={user.id} className="rounded-2xl border border-border p-4 transition hover:bg-secondary/30">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{user.name || user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Tạo lúc: {new Date(user.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="rounded-full border border-border px-3 py-1 text-xs font-medium">{roleLabels[user.role] || user.role}</p>
                    <p className={`mt-2 text-xs font-medium ${user.verified ? 'text-success' : 'text-warning'}`}>
                      {user.verified ? 'Đã xác thực' : 'Chưa xác thực'}
                    </p>
                    <button
                      onClick={() => void toggleVerified(user)}
                      disabled={savingUserId === user.id}
                      className="mt-2 rounded-lg border border-border px-2 py-1 text-xs transition hover:bg-secondary disabled:opacity-60"
                    >
                      {user.verified ? 'Khóa tài khoản' : 'Mở tài khoản'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!staffUsers.length ? <p className="text-sm text-muted-foreground">Không có nhân viên phù hợp bộ lọc.</p> : null}

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Trang {page}/{totalPages} · {total} nhân viên
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs transition hover:bg-secondary disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs transition hover:bg-secondary disabled:opacity-50"
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
