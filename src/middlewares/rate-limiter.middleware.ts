import { Injectable, NestMiddleware } from '@nestjs/common';
import rateLimit from 'express-rate-limit';

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private limiter: any;

  constructor() {
    // تأكد من القيم الافتراضية حتى لا يكون هناك undefined
    const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 دقيقة
    const maxRequests = Number(process.env.RATE_LIMIT_MAX) || 100;

    console.log('RateLimiter Config:', { windowMs, maxRequests });

    this.limiter = rateLimit({
      windowMs,
      max: maxRequests,
      handler: (req, res) => {
        res.status(429).json({ message: 'Too many requests, please try again later' });
      },
    });
  }

  use(req: any, res: any, next: () => void) {
    if (!this.limiter) {
      console.error('❌ RateLimiterMiddleware: Limiter is undefined');
      return next();
    }
    return this.limiter(req, res, next);
  }
}
