import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { Observable, tap } from 'rxjs';
  
  @Injectable()
  export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const { method, url } = request;
  
      console.log(`[${method}] ${url} - Request started`);
  
      const now = Date.now();
      return next.handle().pipe(
        tap(() => console.log(`[${method}] ${url} - Request finished in ${Date.now() - now}ms`)),
      );
    }
  }
  