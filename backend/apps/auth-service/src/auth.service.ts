import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { PrismaService } from './prisma.service';
import Redis from 'ioredis';

const emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://localhost:4070';

interface AccessPayload {
  sub: string;
  email: string;
  name: string;
  type: 'access';
}

interface RefreshPayload {
  sub: string;
  tokenId: string;
  type: 'refresh';
}

@Injectable()
export class AuthService {
  private readonly accessSecret = process.env.JWT_ACCESS_SECRET || 'novax_access_secret_dev';
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET || 'novax_refresh_secret_dev';
  private readonly accessTtlSeconds = this.parseDurationToSeconds(process.env.JWT_ACCESS_TTL || '15m');
  private readonly refreshTtlSeconds = this.parseDurationToSeconds(process.env.JWT_REFRESH_TTL || '30d');
  
  private readonly redis: Redis;

  constructor(private readonly prisma: PrismaService) {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  /**
   * Register new user
   * - Validate email doesn't exist
   * - Hash password with bcrypt
   * - Generate 6-digit OTP
   * - Send OTP email (or store in Redis for dev)
   * - Create unverified user
   */
  async register(email: string, password: string, fullName: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // Validate password strength (min 6 chars)
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minute expiry

    // Create unverified user
    await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName,
        passwordHash,
        verified: false,
        otpCode,
        otpExpiry,
        carts: {
          create: {} // Create empty cart
        }
      }
    });

    // Store OTP in Redis for quick lookup and audit
    await this.redis.setex(`otp:${normalizedEmail}`, 300, otpCode); // 5 min TTL

    await this.sendEmail({
      to: normalizedEmail,
      subject: 'Ma OTP xac thuc tai khoan NovaX',
      template: 'otp',
      variables: {
        name: fullName,
        otpCode,
        expiresInMinutes: 5
      }
    });

    console.log(`[OTP] ${normalizedEmail}: ${otpCode}`);

    return {
      message: 'Registration successful. Check email for OTP code.',
      email: normalizedEmail,
      requiresOtpVerification: true
    };
  }

  /**
   * Verify email with OTP code
   */
  async verifyOtp(email: string, otpCode: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if already verified
    if (user.verified) {
      throw new BadRequestException('User already verified');
    }

    // Validate OTP (check both DB and Redis)
    if (user.otpCode !== otpCode || !user.otpExpiry || user.otpExpiry < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Mark user as verified
    const verifiedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        otpCode: null,
        otpExpiry: null
      }
    });

    // Clear Redis cache
    await this.redis.del(`otp:${normalizedEmail}`);

    await this.sendEmail({
      to: normalizedEmail,
      subject: 'Tai khoan NovaX da kich hoat',
      template: 'welcome',
      variables: {
        name: verifiedUser.fullName || 'ban'
      }
    });

    return {
      message: 'Email verified successfully',
      verified: true
    };
  }

  /**
   * Request new OTP (resend)
   */
  async requestOtp(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.verified) {
      throw new BadRequestException('User already verified');
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode,
        otpExpiry
      }
    });

    // Store in Redis
    await this.redis.setex(`otp:${normalizedEmail}`, 300, otpCode);

    await this.sendEmail({
      to: normalizedEmail,
      subject: 'Ma OTP moi cua ban tai NovaX',
      template: 'otp',
      variables: {
        name: user.fullName || 'ban',
        otpCode,
        expiresInMinutes: 5
      }
    });

    console.log(`[OTP RESEND] ${normalizedEmail}: ${otpCode}`);

    return {
      message: 'OTP sent to email'
    };
  }

  /**
   * Login with verified user
   */
  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.verified) {
      throw new BadRequestException('Please verify email first');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id, user.email, user.fullName || '');
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(refreshToken: string) {
    let payload: RefreshPayload;
    try {
      payload = jwt.verify(refreshToken, this.refreshSecret) as RefreshPayload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh' || !payload.sub || !payload.tokenId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if refresh token exists in DB (not revoked)
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.issueTokens(user.id, user.email, user.fullName || '');
  }

  /**
   * Get user profile from access token
   */
  async getProfile(authHeader?: string) {
    const token = this.extractBearer(authHeader);

    let payload: AccessPayload;
    try {
      payload = jwt.verify(token, this.accessSecret) as AccessPayload;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    if (payload.type !== 'access' || !payload.sub) {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.fullName || '',
      role: user.role
    };
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(authHeader?: string) {
    const token = this.extractBearer(authHeader);

    let payload: AccessPayload;
    try {
      payload = jwt.verify(token, this.accessSecret) as AccessPayload;
    } catch {
      return { success: true };
    }

    // Find and delete refresh tokens for this user
    await this.prisma.refreshToken.deleteMany({
      where: { userId: payload.sub }
    });

    return { success: true };
  }

  async listUsers() {
    const users: Array<{
      id: string;
      email: string;
      fullName: string | null;
      role: 'customer' | 'admin';
      verified: boolean;
      createdAt: Date;
    }> = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        verified: true,
        createdAt: true
      }
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.fullName || '',
      role: user.role,
      verified: user.verified,
      createdAt: user.createdAt
    }));
  }

  async updateUserRole(id: string, role: 'customer' | 'admin') {
    if (role !== 'customer' && role !== 'admin') {
      throw new BadRequestException('Invalid role');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        verified: true,
        createdAt: true
      }
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.fullName || '',
      role: updated.role,
      verified: updated.verified,
      createdAt: updated.createdAt
    };
  }

  async updateUserVerified(id: string, verified: boolean) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        verified,
        ...(verified ? {} : { otpCode: null, otpExpiry: null })
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        verified: true,
        createdAt: true
      }
    });

    if (!verified) {
      await this.prisma.refreshToken.deleteMany({ where: { userId: id } });
    }

    return {
      id: updated.id,
      email: updated.email,
      name: updated.fullName || '',
      role: updated.role,
      verified: updated.verified,
      createdAt: updated.createdAt
    };
  }

  /**
   * Request password reset (send OTP)
   */
  async requestPasswordReset(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If email exists, you will receive a password reset code' };
    }

    // Generate OTP for password reset
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis with longer expiry (15 min)
    await this.redis.setex(`password_reset:${normalizedEmail}`, 900, otpCode);

    await this.sendEmail({
      to: normalizedEmail,
      subject: 'Ma OTP dat lai mat khau NovaX',
      template: 'password-reset',
      variables: {
        name: user.fullName || 'ban',
        otpCode,
        expiresInMinutes: 15
      }
    });

    console.log(`[PASSWORD RESET OTP] ${normalizedEmail}: ${otpCode}`);

    return { message: 'Password reset code sent to email' };
  }

  /**
   * Verify password reset OTP and set new password
   */
  async resetPassword(email: string, otpCode: string, newPassword: string) {
    const normalizedEmail = email.toLowerCase().trim();

    if (newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    // Verify OTP from Redis
    const storedOtp = await this.redis.get(`password_reset:${normalizedEmail}`);
    if (storedOtp !== otpCode) {
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash: hashedPassword }
    });

    // Invalidate all refresh tokens (security: force re-login after password change)
    await this.prisma.refreshToken.deleteMany({
      where: { user: { email: normalizedEmail } }
    });

    // Clear Redis
    await this.redis.del(`password_reset:${normalizedEmail}`);

    return { message: 'Password reset successful' };
  }

  // ============= PRIVATE HELPERS =============

  private async issueTokens(userId: string, email: string, fullName: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const tokenId = crypto.randomUUID();

    const accessToken = jwt.sign(
      {
        sub: userId,
        email,
        name: fullName,
        type: 'access'
      },
      this.accessSecret,
      { expiresIn: this.accessTtlSeconds }
    );

    const refreshToken = jwt.sign(
      {
        sub: userId,
        tokenId,
        type: 'refresh'
      },
      this.refreshSecret,
      { expiresIn: this.refreshTtlSeconds }
    );

    // Store refresh token in DB
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + this.refreshTtlSeconds * 1000)
      }
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        name: fullName,
        role: user?.role
      }
    };
  }

  private extractBearer(authHeader?: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    return token;
  }

  private parseDurationToSeconds(input: string) {
    const value = input.trim().toLowerCase();
    const amount = Number(value.replace(/[^0-9]/g, ''));
    const unit = value.replace(/[0-9]/g, '');

    if (!Number.isFinite(amount) || amount <= 0) {
      return 900;
    }

    if (unit === 's' || unit === '') return amount;
    if (unit === 'm') return amount * 60;
    if (unit === 'h') return amount * 3600;
    if (unit === 'd') return amount * 86400;

    return 900;
  }

  private async sendEmail(payload: {
    to: string;
    subject: string;
    template: 'otp' | 'password-reset' | 'welcome';
    variables?: Record<string, string | number>;
  }) {
    try {
      await fetch(new URL('/emails/send', emailServiceUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch {
      // Keep auth flow resilient if email-service is temporarily unavailable.
    }
  }
}
