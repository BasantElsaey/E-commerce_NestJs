import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../../utility/common/enums/order-status.enum';

export class UpdateOrderDto {
  @IsEnum(OrderStatus, { message: 'Invalid order status' })
  @IsOptional()
  status?: OrderStatus;

  @IsOptional() 
  @IsArray( { message: 'Items must be an array' })  
  items ?: [];

  
  
//   @IsString({ message: 'Shipping address must be a string' })
//   @IsOptional()
//   shippingAddress?: string;
}
