export class PaymentProcessedEvent {
    constructor(
      public readonly orderId: number,
      public readonly amount: number,
      public readonly email: string,
    ) {}
  }