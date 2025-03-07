import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { UsersService } from './users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import { CurrentUserMiddleware } from './middlewares/current-user.middleware';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true
  }));
  
  const usersService = app.get(UsersService);
  const jwtService = app.get(JwtService);
  app.use(new CurrentUserMiddleware(jwtService, usersService).use);

  await app.listen(process.env.PORT ?? 3000);

}

bootstrap();

