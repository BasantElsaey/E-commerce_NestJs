import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import * as dotenv from 'dotenv';
dotenv.config();
import { JwtModule } from '@nestjs/jwt';
import { CurrentUserMiddleware } from './utility/middlewares/current-user.middleware';
import { MiddlewareConsumer, RequestMethod } from '@nestjs/common';
@Module({
  imports: [ConfigModule.forRoot({envFilePath:'.env',isGlobal:true})
    ,DatabaseModule,UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY, 
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN 

      }})
  ],
  controllers: [AppController,UsersController],
  providers: [AppService,UsersService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CurrentUserMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
