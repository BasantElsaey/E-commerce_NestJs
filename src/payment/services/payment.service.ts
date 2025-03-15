import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException, Body } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { OrdersService } from '../../orders/services/orders.service';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from '../../orders/models/order.model';
import { OrderItem } from '../../orders/models/order-item.model';
import { Product } from '../../products/models/product.model';
import { Payment } from '../models/payment.model';
import { CurrentUser } from 'src/utility/common/decorators/current-user.decorator';
import { User } from 'src/users/models/user.model';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import {Job, Queue} from 'bull'
import {InjectQueue} from '@nestjs/bull'
import { Logger } from '@nestjs/common';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private configService: ConfigService,
    private ordersService: OrdersService,
    @InjectModel(Order) private orderModel: typeof Order,
    @InjectModel(OrderItem) private orderItemsModel: typeof OrderItem,
    @InjectModel(Product) private productModel: typeof Product,
    @InjectModel(Payment) private paymentModel: typeof Payment,
    @InjectQueue('payment') private paymentQueue: Queue

  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in the environment variables');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: this.configService.get<string>('STRIPE_API_VERSION') as Stripe.LatestApiVersion,
    });
  }

  async createPaymentIntent(
    currency: string, paymentMethod: string, @CurrentUser() currentUser: User,
    cartItems : any[],
    orderId : number,
    @Body() createPaymentDto : CreatePaymentDto 
  ): 
  Promise<{ clientSecret: string }> {
    
      const order = await this.ordersService.createOrderFromCart
      ( cartItems, currentUser.id );
      if (!order) {
        throw new BadRequestException('Failed to create order from cart');
      }

      const availableMethods = {
        'card': ['card'],
        'apple_pay': ['apple_pay', 'card'],
        'google_pay': ['google_pay', 'card'],
        'paypal': ['paypal'],
        'bank_transfer': ['sepa_debit', 'sofort'],
        'cod': [],
      };

      if (!availableMethods[createPaymentDto.paymentMethod]) {
        throw new BadRequestException(`Unsupported payment method: ${createPaymentDto.paymentMethod}`);
      }

      if (createPaymentDto.paymentMethod === 'cod') {
        await this.paymentModel.create({
          paymentIntentId: null,
          totalPrice: order.totalPrice * 100,
          orderId: createPaymentDto.orderId,
          userId: currentUser.id,
          currency,
          status: 'pending',
          method: 'cod',
          metadata: {},
        });

        return { clientSecret: 'COD_PAYMENT' };
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: order.totalPrice * 100,
        currency,
        payment_method_types: availableMethods[createPaymentDto.paymentMethod],
        metadata: { orderId: createPaymentDto.orderId.toString() },
      });

      if (!paymentIntent.client_secret) {
        throw new Error('Payment Intent client_secret is missing');
      }

      await this.paymentModel.create({
        paymentIntentId: paymentIntent.id,
        orderId: createPaymentDto.orderId,
        userId: currentUser.id,
        amount: order.totalPrice * 100,
        currency,
        status: 'pending',
        method: createPaymentDto.paymentMethod,
        metadata: paymentIntent.metadata,
      });

      return { clientSecret: paymentIntent.client_secret }
  }

  async confirmPayment(paymentIntentId: string): Promise<{ message: string }> {
 
      const payment = await this.paymentModel.findOne({ where: { paymentIntentId } });
      if (!payment) throw new NotFoundException('Payment record not found');

      if (payment.method === 'cod') {
        throw new BadRequestException('COD payments do not require confirmation');
      }

      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      if (!paymentIntent) throw new NotFoundException('Payment Intent not found');

      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException('Payment not completed');
      }

      await this.ordersService.updateOrderStatus(payment.orderId, 'paid');
      await payment.update({ status: 'succeeded' });
      await payment.save();

      return { message: 'Payment confirmed successfully' };
  }

  async refundPayment(paymentIntentId: string): Promise<Stripe.Refund> {
  
      const payment = await this.paymentModel.findOne({ where: { paymentIntentId } });
      if (!payment) throw new NotFoundException('Payment record not found');

      if (payment.method === 'cod') {
        throw new BadRequestException('COD payments cannot be refunded');
      }

      const refund = await this.stripe.refunds.create({ payment_intent: paymentIntentId });

      await this.ordersService.updateOrderStatus(payment.orderId, 'refunded');
      await payment.update({ status: 'refunded' });
      await payment.save();

      const orderItems = await this.orderItemsModel.findAll({ where: { orderId: payment.orderId } });
      for (const item of orderItems) {
        const product = await this.productModel.findByPk(item.productId);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }

      return refund;
  }

  async cancelPayment(paymentIntentId: string): Promise<{ message: string; canceledPayment?: Stripe.PaymentIntent }> {
   
      const payment = await this.paymentModel.findOne({ where: { paymentIntentId } });
      if (!payment) throw new NotFoundException('Payment record not found');

      if (payment.method === 'cod') {
        await payment.update({ status: 'canceled' });
        return { message: 'COD payment canceled' };
      }

      const canceledPayment = await this.stripe.paymentIntents.cancel(paymentIntentId);
      await payment.update({ status: 'canceled' });

      return { message: 'Payment canceled successfully', canceledPayment };
  }

  async handleWebhook(event: Stripe.Event) : Promise<void> {

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.ordersService.updateOrderStatus(parseInt(paymentIntent.metadata.orderId), 'paid');
        await this.paymentModel.update({ status: 'succeeded' }, { where: { paymentIntentId: paymentIntent.id } });
      }

      if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error(`Payment failed for Order ID ${paymentIntent.metadata.orderId}`);
        await this.paymentModel.update({ status: 'failed' }, { where: { paymentIntentId: paymentIntent.id } });
      }
  }

  async processPayment(createPaymentDto: CreatePaymentDto, @CurrentUser() currentUser: User
): Promise<{ message: string; job: Job}> {

  // this.logger.log --> public info
     this.logger.log(`Starting payment processing for orderId ${createPaymentDto.orderId} with amount ${createPaymentDto.amount}`);
     const job = await this.paymentQueue.add('process', 
      { orderId: createPaymentDto.orderId, amount : createPaymentDto.amount ,
        email : currentUser.email},
      {
        attempts : 3,
        backoff: 5000
      });
      if (!job) {

        this.logger.error(`Failed to add payment job to queue for orderId 
          ${createPaymentDto.orderId}`); 
      }
      // this.logger.debug --> details of debug
      this.logger.debug(`payment queued successfully with orderId ${createPaymentDto.orderId}`);

      return { message: 'Payment Processing Started', job };
  }
}
