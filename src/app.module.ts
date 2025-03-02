import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
// import { UsersController } from './users/controllers/users.controller';
import { UsersService } from './users/services/users.service';
import * as dotenv from 'dotenv';
dotenv.config();
import { JwtModule } from '@nestjs/jwt';
// import { CurrentUserMiddleware } from './utility/middlewares/current-user.middleware';
import { MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/services/auth.service';
import { RateLimiterMiddleware } from './middlewares/rate-limiter.middleware';
import { ReviewsModule } from './reviews/reviews.module';
import { OrdersModule } from './orders/orders.module';
import { CartsModule } from './carts/carts.module';
@Module({
  imports: [ConfigModule.forRoot({envFilePath:'.env',isGlobal:true})
    ,DatabaseModule,UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY, 
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN 

      }}),
    CategoriesModule,
    ProductsModule,
    AuthModule,
    ReviewsModule,
    OrdersModule,
    CartsModule,
    
  ],
  // controllers: [AppController,UsersController],
  providers: [AppService,AuthService,UsersService],
})
export class AppModule {
  
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimiterMiddleware).forRoutes('*'); 
  }
}
