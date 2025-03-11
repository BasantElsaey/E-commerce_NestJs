import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value; // if no metatype is provided, just return the value
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const errorMessages = errors.map(err =>
        err.constraints
          ? Object.values(err.constraints).join(', ')
          : 'Unknown validation error',
      );
      throw new BadRequestException(`Validation failed: ${errorMessages.join('; ')}`);
    }

    return value;
  }

   // determine the type of the value
  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
