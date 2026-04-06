import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { register } from '@/services/authApi';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!fullName.trim()) {
      toast.error('Vui lòng nhập tên đầy đủ');
      return;
    }

    if (!email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    if (password.length < 6) {
      toast.error('Mật khẩu phải từ 6 ký tự trở lên');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Mật khẩu không khớp');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email.toLowerCase().trim(), password, fullName.trim());

      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
      navigate('/verify-email', { state: { email: email.toLowerCase().trim() } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-md">
      <div className="bg-card border border-border rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-2">Đăng ký tài khoản</h1>
        <p className="text-sm text-muted-foreground mb-6">Tạo tài khoản mới để bắt đầu mua sắm</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Tên đầy đủ</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Xác nhận mật khẩu</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nhập lại mật khẩu"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full gradient-primary text-primary-foreground rounded-lg py-2.5 font-semibold disabled:opacity-60"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-muted-foreground">Đã có tài khoản? </span>
          <a href="/login" className="text-primary hover:underline font-medium">
            Đăng nhập
          </a>
        </div>
      </div>
    </div>
  );
}
