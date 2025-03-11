import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    RequestTimeoutException,
  } from '@nestjs/common';
  import { Observable, throwError, timeout, catchError } from 'rxjs';
  
  @Injectable()
  export class TimeoutInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle().pipe(
        timeout(10000), // 10 seconds
        catchError((error) => {
          if (error.name === 'TimeoutError') {
            return throwError(() => new RequestTimeoutException('Request timed out'));
          }
          return throwError(() => error);
        }),
      );
    }
  }
  