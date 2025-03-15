import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import { CurrentUserMiddleware } from './middlewares/current-user.middleware';
import * as dotenv from 'dotenv';
dotenv.config();
import { GlobalExceptionFilter } from './utility/common/filters/http-exception.filter';
import { ValidationPipe } from './utility/common/pipes/validation.pipe';
import { TransformInterceptor } from './utility/common/interceptors/transform.interceptor';
import { ErrorsInterceptor } from './utility/common/interceptors/errors.interceptor';
import { LoggingInterceptor } from './utility/common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './utility/common/interceptors/timeout.interceptor';
import { FastifyAdapter,NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCompress from '@fastify/compress';
import { constants } from 'zlib';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule,new FastifyAdapter(), { cors: true });

 
  await app.register(fastifyCompress, { // compress responses

    encodings : ['gzip', 'deflate','br'], // supported encodings
    threshold: 1024, // bytes, default: 1kb
  });

  // rate limit
  await app.register(require('@fastify/rate-limit'), {
    max: 1200,
    timeWindow: '2 hours',
});


  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(
   new TransformInterceptor(),
   new ErrorsInterceptor(),
   new LoggingInterceptor(),
   new TimeoutInterceptor()
  );
  
  const usersService = app.get(UsersService);
  const jwtService = app.get(JwtService);
  app.use(new CurrentUserMiddleware(jwtService, usersService).use);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();


function compression(): any {
  throw new Error('Function not implemented.');
}

