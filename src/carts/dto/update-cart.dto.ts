import { PartialType } from '@nestjs/mapped-types';
import { CreateCartDto } from './create-cart.dto';
import { IsNumber, Min } from 'class-validator';

export class UpdateCartDto extends PartialType(CreateCartDto) {
  @IsNumber({}, { message: 'Quantity must be a valid number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}
