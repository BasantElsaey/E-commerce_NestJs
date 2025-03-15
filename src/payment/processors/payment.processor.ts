// src/payments/payments.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from '../../orders/models/order.model';
import { firstValueFrom } from 'rxjs';
import { EmailService } from '../../auth/services/email.service';
import { PaymentProcessedEvent } from '../events/payment.events';
import {EventEmitter2} from '@nestjs/event-emitter';
import { Inject } from '@nestjs/common';

@Processor('payment')
export class PaymentProcessor {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Order) private orderModel: typeof Order,
    private readonly emailService: EmailService,
    @Inject ('EventEmitter') private eventEmitter: EventEmitter2
  ) {}


  @Process('process')
  async handlePayment(job: Job<{ orderId: number; amount: number; email?: string }>): Promise<string> {
    const { orderId, amount, email } = job.data;

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

        // Emit the event
        this.eventEmitter.emit('payment.processed', new PaymentProcessedEvent(orderId, amount, email || ''));

        const order = await this.orderModel.findOne({ where: { id: orderId } });
        if (!order) {
          throw new Error(`Order ${orderId} not found`);
        }
 
        const recipientEmail = email || order.user.email;
        await this.emailService.sendPaymentConfirmationEmail(orderId, recipientEmail, amount);

        return `Payment processed for order ${orderId} and email sent`;
      } else {
        await this.orderModel.update(
          { status: 'FAILED' },
          { where: { id: orderId } },
        );
        return `Payment failed for order ${orderId}`;
      }
  }
}