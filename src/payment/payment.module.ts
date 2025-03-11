import { Module } from '@nestjs/common';
import { PaymentService } from './services/payment.service';
import { PaymentController } from './controllers/payment.controller';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { Review } from 'src/reviews/models/review.model';
import { Product } from 'src/products/models/product.model';
import { OrderItem } from 'src/orders/models/order-item.model';
import { Order } from 'src/orders/models/order.model';
import { Cart } from 'src/carts/models/cart.model';
import { OrdersService } from 'src/orders/services/orders.service';
import { CartService } from 'src/carts/services/carts.service';
import { ReviewsService } from 'src/reviews/services/reviews.service';
import { ProductsService } from 'src/products/services/products.service';
import { CartItem } from 'src/carts/models/cart-item.model';
import { Payment } from './models/payment.model';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([Payment,Order, OrderItem, Product, Review,Cart,CartItem]),
  ],
  providers: [
    PaymentService,
    OrdersService,
    ProductsService,
    CartService,
    ReviewsService,
  ],
  controllers: [PaymentController],
  exports : [PaymentService]
})
export class PaymentModule {}
