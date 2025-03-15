import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './services/orders.service';
import { OrdersController } from './controllers/orders.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Order } from './models/order.model';
import { OrderItem } from './models/order-item.model';
import { Cart } from 'src/carts/models/cart.model';
import { CartItem } from 'src/carts/models/cart-item.model';
import { Product } from 'src/products/models/product.model';
import { ProductsModule } from 'src/products/products.module';
@Module({
  imports: [
    SequelizeModule.forFeature([Order,OrderItem,Cart,CartItem,Product]),
    // circular dependency
    forwardRef(() => ProductsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService,SequelizeModule],
})
export class OrdersModule {}
