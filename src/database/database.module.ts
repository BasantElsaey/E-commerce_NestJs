import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { User } from 'src/users/models/user.model';
import { Category } from 'src/categories/models/category.model';
import { Product } from 'src/products/models/product.model';
import { Review } from 'src/reviews/models/review.model';
import { Order } from 'src/orders/models/order.model';
import { Cart } from 'src/carts/models/cart.model';
import { ModelCtor } from 'sequelize-typescript';
import { OrderItem } from 'src/orders/models/order-item.model';

@Module({
  imports: [
    ConfigModule.forRoot({envFilePath: '.env', isGlobal: true}),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        models : [User,Category,Product,Review,Order,OrderItem,Cart] as unknown as ModelCtor[],
        autoLoadModels: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
