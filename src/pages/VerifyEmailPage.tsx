import { FormEvent, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { requestOtp, verifyOtp } from '@/services/authApi';

export default function VerifyEmailPage() {
  const location = useLocation() as { state?: { email?: string } };
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Handle cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const onVerify = async (event: FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    if (otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
      toast.error('Vui lòng nhập mã OTP 6 chữ số');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtp(email.toLowerCase().trim(), otpCode);

      toast.success('Email xác thực thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResend = async () => {
    if (!email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    try {
      await requestOtp(email.toLowerCase().trim());

      toast.success('Mã OTP mới đã được gửi đến email');
      setResendCooldown(60); // 60 second cooldown
      setOtpCode(''); // Clear input
    } catch (err) {
      toast.error('Không thể gửi lại mã OTP');
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-md">
      <div className="bg-card border border-border rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-2">Xác thực email</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Nhập mã OTP 6 chữ số đã được gửi đến <strong>{email || 'email của bạn'}</strong>
        </p>

        <form onSubmit={onVerify} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Mã OTP (6 chữ số)</label>
            <input
              type="text"
              maxLength={6}
              required
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-center tracking-widest outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              placeholder="000000"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tìm mã OTP trong email hoặc trong console (chế độ dev)
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otpCode.length !== 6}
            className="w-full gradient-primary text-primary-foreground rounded-lg py-2.5 font-semibold disabled:opacity-60"
          >
            {isSubmitting ? 'Đang xác thực...' : 'Xác thực'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={onResend}
            disabled={resendCooldown > 0 || isSubmitting}
            className="text-sm text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại mã OTP'}
          </button>
        </div>

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
