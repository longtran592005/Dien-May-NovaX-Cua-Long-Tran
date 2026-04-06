import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { requestPasswordReset, resetPassword } from '@/services/authApi';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const onRequestReset = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email.toLowerCase().trim());
      toast.success('Mã reset đã được gửi. Kiểm tra email/console dev.');
      setStep('confirm');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gửi mã reset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onConfirmReset = async (event: FormEvent) => {
    event.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Mã OTP phải có 6 chữ số');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải từ 6 ký tự');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email.toLowerCase().trim(), otpCode, newPassword);
      toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      navigate('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể đổi mật khẩu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-md">
      <div className="bg-card border border-border rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-2">Quên mật khẩu</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {step === 'request'
            ? 'Nhập email để nhận mã OTP đặt lại mật khẩu'
            : 'Nhập mã OTP và mật khẩu mới'}
        </p>

        {step === 'request' ? (
          <form onSubmit={onRequestReset} className="space-y-4">
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full gradient-primary text-primary-foreground rounded-lg py-2.5 font-semibold disabled:opacity-60"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={onConfirmReset} className="space-y-4">
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
              <label className="text-sm font-medium block mb-1">Mã OTP</label>
              <input
                type="text"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-center tracking-widest text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Mật khẩu mới</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full gradient-primary text-primary-foreground rounded-lg py-2.5 font-semibold disabled:opacity-60"
            >
              {isSubmitting ? 'Đang đổi mật khẩu...' : 'Xác nhận đổi mật khẩu'}
            </button>
          </form>
        )}

        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="text-primary hover:underline font-medium">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
