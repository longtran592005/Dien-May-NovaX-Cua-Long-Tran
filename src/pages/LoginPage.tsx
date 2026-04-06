import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('user@email.com');
  const [password, setPassword] = useState('123456');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  const redirectTo = location.state?.from || '/profile';

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Dang nhap thanh cong');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Dang nhap that bai';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-md">
      <div className="bg-card border border-border rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-2">Dang nhap</h1>
        <p className="text-sm text-muted-foreground mb-6">Tai khoan demo: user@email.com / 123456</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Mat khau</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full gradient-primary text-primary-foreground rounded-lg py-2.5 font-semibold disabled:opacity-60"
          >
            {isSubmitting ? 'Dang xu ly...' : 'Dang nhap'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <a href="/register" className="text-primary hover:underline font-medium">
            Tạo tài khoản mới
          </a>
          <a href="/forgot-password" className="text-primary hover:underline font-medium">
            Quên mật khẩu?
          </a>
        </div>
      </div>
    </div>
  );
}
