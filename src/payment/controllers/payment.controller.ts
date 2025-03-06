import { 
    Controller, Post, Get, Param, Body, UseGuards, Req, Res, HttpStatus 
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
  
  @Controller('payments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  export class PaymentController {
    constructor(
      private readonly paymentService: PaymentService,
      private configService: ConfigService,
    ) {}
  
    // create a new payment intent and relate it to the order
    @Post('create-payment-intent')
    async createPaymentIntent(
      @CurrentUser() currentUser: User, 
      @Body() createPaymentDto: CreatePaymentDto,
      paymentMethod: string
    ): Promise<{ clientSecret: string }> {
      return this.paymentService.createPaymentIntent(
      createPaymentDto.currency, paymentMethod, currentUser, createPaymentDto
    );
    }
  
    // confirm the payment 
    @Post('confirm/:paymentIntentId')
    async confirmPayment(
        @Param('paymentIntentId') paymentIntentId: string): Promise<{ message: string }> {
      return this.paymentService.confirmPayment(paymentIntentId);
    }
  
    // refund the money and restore the stock
    @Post('refund/:paymentIntentId')
    async refundPayment(@Param('paymentIntentId') paymentIntentId: string): 
    Promise<Stripe.Refund> {
      return this.paymentService.refundPayment(paymentIntentId);
    }
  
    // cancel the payment   
    @Post('cancel/:paymentIntentId')
    async cancelPayment(@Param('paymentIntentId') paymentIntentId: string):
     Promise<{ message: string; canceledPayment?: Stripe.PaymentIntent }> {
      return await this.paymentService.cancelPayment(paymentIntentId);
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

      try {
        event = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY') || '', {
          apiVersion: this.configService.get<string>('STRIPE_API_VERSION') as Stripe.LatestApiVersion,
        }).webhooks.constructEvent(req.body, sig, endpointSecret);
       
      } catch (err) {
        return res.status(HttpStatus.BAD_REQUEST).send(`Webhook error: ${err.message}`);
      }
  
      await this.paymentService.handleWebhook(event);
      return res.status(HttpStatus.OK).json({ received: true });
    }
  }
  