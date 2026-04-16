import { Controller, Post, Get, Body, Headers, HttpCode, Patch, Param } from '@nestjs/common';
import { AuthService } from './auth.service';

interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
}

interface VerifyOtpDto {
  email: string;
  otpCode: string;
}

interface LoginDto {
  email: string;
  password: string;
}

interface RefreshDto {
  refreshToken: string;
}

interface RequestPasswordResetDto {
  email: string;
}

interface ResetPasswordDto {
  email: string;
  otpCode: string;
  newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register new user
   * POST /auth/register
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.fullName);
  }

  /**
   * Verify email with OTP
   * POST /auth/verify-otp
   */
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otpCode);
  }

  /**
   * Request new OTP (resend)
   * POST /auth/request-otp
   */
  @Post('request-otp')
  async requestOtp(@Body('email') email: string) {
    return this.authService.requestOtp(email);
  }

  /**
   * Login with email and password
   * POST /auth/login
   */
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  /**
   * Get current user profile
   * GET /auth/me
   */
  @Get('me')
  async getProfile(@Headers('authorization') authHeader?: string) {
    return this.authService.getProfile(authHeader);
  }

  /**
   * Logout (revoke refresh tokens)
   * POST /auth/logout
   */
  @Post('logout')
  @HttpCode(200)
  async logout(@Headers('authorization') authHeader?: string) {
    return this.authService.logout(authHeader);
  }

  /**
   * Admin only: list users
   * GET /auth/admin/users
   */
  @Get('admin/users')
  async listUsers() {
    return this.authService.listUsers();
  }

  /**
   * Admin only: update user role
   * PATCH /auth/admin/users/:id/role
   */
  @Patch('admin/users/:id/role')
  async updateUserRole(@Param('id') id: string, @Body() dto: { role: 'customer' | 'admin' }) {
    return this.authService.updateUserRole(id, dto.role);
  }

  /**
   * Admin only: update user verification status
   * PATCH /auth/admin/users/:id/verified
   */
  @Patch('admin/users/:id/verified')
  async updateUserVerified(@Param('id') id: string, @Body() dto: { verified: boolean }) {
    return this.authService.updateUserVerified(id, dto.verified);
  }

  /**
   * Request password reset OTP
   * POST /auth/request-password-reset
   */
  @Post('request-password-reset')
  async requestPasswordReset(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  /**
   * Reset password with OTP
   * POST /auth/reset-password
   */
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otpCode, dto.newPassword);
  }

  /**
   * Google OAuth Login
   * POST /auth/google
   */
  @Post('google')
  async googleLogin(@Body('idToken') idToken: string) {
    return this.authService.googleLogin(idToken);
  }
}
