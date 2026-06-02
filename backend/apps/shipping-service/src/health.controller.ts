import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      status: 'healthy',
      service: 'shipping-service',
      timestamp: new Date().toISOString()
    };
  }
}
