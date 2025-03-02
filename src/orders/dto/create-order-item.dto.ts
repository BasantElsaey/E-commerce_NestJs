import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateOrderItemDto {
  @IsNumber({}, { message: 'Product ID must be a valid number' })
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: number;

  @IsNumber({}, { message: 'Quantity must be a valid number' })
  @IsNotEmpty({ message: 'Quantity is required' })
  quantity: number;
}
