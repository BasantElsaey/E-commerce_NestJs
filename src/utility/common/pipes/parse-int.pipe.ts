import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);

    if (isNaN(val) || typeof val !== 'number') {
      throw new BadRequestException(`Invalid ID: ${value} is not a valid number.`);
    }
    else if(val <= 0) {
      throw new BadRequestException(`Invalid ID: ${value} is not a positive number.`);
    }
    return val;
  }
}
