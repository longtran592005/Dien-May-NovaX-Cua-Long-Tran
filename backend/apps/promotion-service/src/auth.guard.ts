import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const apiKey = req.headers['x-api-key'];
    const adminKey = process.env.PROMOTION_ADMIN_KEY;
    if (adminKey && apiKey === adminKey) return true;

    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth) throw new ForbiddenException('Not authorized');
    const parts = String(auth).split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') throw new ForbiddenException('Invalid authorization header');
    const token = parts[1];
    const secret = process.env.PROMOTION_JWT_SECRET;
    if (!secret) throw new ForbiddenException('Auth not configured');
    try {
      const payload = jwt.verify(token, secret) as any;
      if (payload && payload.role === 'admin') return true;
      throw new ForbiddenException('Insufficient role');
    } catch (err) {
      throw new ForbiddenException('Invalid token');
    }
  }
}
