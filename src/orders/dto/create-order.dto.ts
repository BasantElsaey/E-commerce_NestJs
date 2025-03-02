import { IsArray, ValidateNested, IsOptional, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';
// import { PaymentMethod } from '../enums/payment-method.enum';

export class CreateOrderDto {
  @IsArray({ message: 'Items must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

//   @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
//   paymentMethod: PaymentMethod;

//   @IsString({ message: 'Shipping address must be a string' })
//   @IsOptional()
//   shippingAddress?: string;
}
