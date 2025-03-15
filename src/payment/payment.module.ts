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
import { BullModule } from '@nestjs/bull';
import { PaymentProcessor } from './processors/payment.processor';
import { HttpModule, HttpService } from '@nestjs/axios';
import { EmailService } from 'src/auth/services/email.service';
import { UsersModule } from 'src/users/users.module';
import { User } from 'src/users/models/user.model';
import { OrdersModule } from 'src/orders/orders.module';
import { PaymentProcessedEvent } from './events/payment.events';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'payment' }),
    ConfigModule,
    HttpModule,
    UsersModule,
    OrdersModule,
    SequelizeModule.forFeature([User,Payment,Order, OrderItem, Product, Review,Cart,CartItem]),
  ],
  providers: [
    {
      provide : 'PAYMENT_GATEWAY',
      useClass : PaymentService
    },
    OrdersService,
    ProductsService,
    CartService,
    ReviewsService,
    PaymentProcessor,
    EmailService,
    PaymentProcessedEvent,
    {
      provide : 'EventEmitter',
      useValue : new EventEmitter2()
    }
    
  ],
  controllers: [PaymentController],
  exports : ['PAYMENT_GATEWAY','EventEmitter']
})
export class PaymentModule {}