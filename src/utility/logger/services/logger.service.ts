import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class AppLogger implements LoggerService {
  log(message: string) {
    console.log(`${message}`);
  }

  error(message: string, trace?: string) {
    console.error(`${message}`, trace || '');
  }

  warn(message: string) {
    console.warn(`${message}`);
  }

  debug(message: string) {
    console.debug(`${message}`);
  }

  verbose(message: string) {
    console.info(`${message}`);
  }
}
