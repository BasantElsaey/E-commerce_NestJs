import { 
    Controller, Post, Get, Param, Body, UseGuards, Req, Res, HttpStatus, 
    Inject
  } from '@nestjs/common';
  import { PaymentService } from '../services/payment.service';
  import { CurrentUser } from 'src/utility/common/decorators/current-user.decorator';
  import { User } from 'src/users/models/user.model';
  import { AuthGuard } from '@nestjs/passport';
  import { ConfigService } from '@nestjs/config';
  import Stripe from 'stripe';
  import { Response, Request } from 'express';
import { CreatePaymentDto } from '../dto/create-payment.dto';
  import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Process, Processor } from '@nestjs/bull';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Job } from 'bull';
import { Order } from 'src/orders/models/order.model';
import { InjectModel } from '@nestjs/sequelize';
  
  @Controller('payments')
  @Processor('payment')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  export class PaymentController {
    constructor(
      @Inject('PAYMENT_GATEWAY') private paymentGateway: PaymentService,
      private configService: ConfigService,
      private httpService: HttpService,
      @InjectModel(Order) private orderModel: typeof Order
    ) {}
  
    // create a new payment intent and relate it to the order
    @Post('create-payment-intent')
    async createPaymentIntent(
      @CurrentUser() currentUser: User, 
      @Body() createPaymentDto: CreatePaymentDto,
      @Res() res: Response // to manage cookies
    ): Promise<{ clientSecret: string }> {
      const paymentIntent = await this.paymentGateway.createPaymentIntent(
      createPaymentDto.currency,
      createPaymentDto.paymentMethod,
      currentUser,
      createPaymentDto.cartItems,
      createPaymentDto.orderId,
      createPaymentDto,
    );
    // Add cookie to store the paymentIntentId
    res.cookie('paymentIntentId', paymentIntent.clientSecret, {
      httpOnly: true, // security against XSS
      secure: process.env.NODE_ENV === 'production',// secure in production
      maxAge: 1000 * 60 * 60, // 1 hour
    });
    return paymentIntent;
}
    
  
    // confirm the payment 
    @Post('confirm/:paymentIntentId')
    async confirmPayment(
        @Param('paymentIntentId') paymentIntentId: string): Promise<{ message: string }> {
      return this.paymentGateway.confirmPayment(paymentIntentId);
    }
  
    // refund the money and restore the stock
    @Post('refund/:paymentIntentId')
    async refundPayment(@Param('paymentIntentId') paymentIntentId: string): 
    Promise<Stripe.Refund> {
      return this.paymentGateway.refundPayment(paymentIntentId);
    }
  
    // cancel the payment   
    @Post('cancel/:paymentIntentId')
    async cancelPayment(@Param('paymentIntentId') paymentIntentId: string):
     Promise<{ message: string; canceledPayment?: Stripe.PaymentIntent }> {
      return await this.paymentGateway.cancelPayment(paymentIntentId);
    }
  
    // handle notifications from stripe
    @Post('webhook')
    async handleWebhook(@Req() req: Request, @Res() res: Response): Promise<Response> {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

      if (!sig || !endpointSecret) {
        return res.status(HttpStatus.BAD_REQUEST).send('Missing Stripe signature or endpoint secret');
      }
  
      let event: Stripe.Event;


        event = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY') || '', {
          apiVersion: this.configService.get<string>('STRIPE_API_VERSION') as Stripe.LatestApiVersion,
        }).webhooks.constructEvent(req.body, sig, endpointSecret);
  
      await this.paymentGateway.handleWebhook(event);
      return res.status(HttpStatus.OK).json({ received: true });
    }

    @Process('process')
  async handlePayment(job: Job, @CurrentUser() currentUser: User, order : Order) : Promise<string> {
    const { orderId, amount } = job.data;
      const response = await firstValueFrom(
        this.httpService.post('https://payment-gateway.com/api/process', {
          orderId,
          amount,
        }),
      );

      if (response.data.success) {
        await this.orderModel.update(
          { status: 'PAID' },
          { where: { id: orderId } },
        );
        return `Payment processed for order ${orderId}`;
      } else {
        await this.orderModel.update(
          { status: 'FAILED' },
          { where: { id: orderId } },
        );
        return `Payment failed for order ${orderId}`;
      }
    
  }
}

  