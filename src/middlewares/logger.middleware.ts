import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLogger } from 'src/utility/logger/services/logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    constructor(private readonly logger: AppLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const userAgent = req.get('user-agent') || ''; 
    const startTime = Date.now(); // Start time

    res.on('finish', () => {
      const { statusCode } = res;
      const elapsedTime = Date.now() - startTime;  // Execution time

      const logMessage = `[${method}] ${originalUrl} - Status: ${statusCode} - Duration: ${elapsedTime}ms - User-Agent: ${userAgent}`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
