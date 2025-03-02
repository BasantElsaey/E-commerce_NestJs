import { IsNumber, IsPositive, Min } from 'class-validator';

export class CreateCartDto {
  @IsNumber({}, { message: 'Product ID must be a valid number' })
  @IsPositive({ message: 'Product ID must be a positive number' })
  productId: number;

  @IsNumber({}, { message: 'Quantity must be a valid number' })
  @IsPositive({ message: 'Product ID must be a positive number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}
