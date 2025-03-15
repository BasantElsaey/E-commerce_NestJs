import { IsIn, IsNotEmpty, IsString } from "class-validator";
export class CreatePaymentDto {
    @IsString({message : 'Currency must be a string' })
    @IsNotEmpty({message : 'Currency is required' })  
    currency: string;
  
    @IsString({message : 'Payment method must be a string' })
    @IsNotEmpty({message : 'Payment method is required' })
    @IsIn(['card', 'apple_pay', 'google_pay', 'paypal', 'bank_transfer', 'cod'])
    paymentMethod: string;

    @IsNotEmpty({message : 'Order id is required' })
    @IsString({message : 'Order id must be a number' })
    orderId : number

     
    cartItems : [] 

    @IsNotEmpty({message : 'Amount is required' })
    @IsString({message : 'Amount must be a number' })
    amount : number
  }