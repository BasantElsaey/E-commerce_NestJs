import { Module } from '@nestjs/common';
import { CartController } from './controllers/carts.controller';
import { CartService } from './services/carts.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Cart } from './models/cart.model';
@Module({
  imports: [SequelizeModule.forFeature([Cart])],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartsModule {}
