import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { map, Observable } from 'rxjs';
  
  @Injectable()
  export class TransformInterceptor<T> implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle().pipe(
        map((data) => ({
          status: 'success',
          data,
        })),
      );
    }
  }
  