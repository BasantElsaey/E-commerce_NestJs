import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    InternalServerErrorException,
  } from '@nestjs/common';
  import { catchError, Observable } from 'rxjs';
  import { throwError } from 'rxjs';
  
  @Injectable()
  export class ErrorsInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle().pipe(
        catchError((error) => {
          console.error(`Error: ${error.message}`);
          return throwError(() => 
            new InternalServerErrorException('An unexpected error occurred'));
        }),
      );
    }
  }
  