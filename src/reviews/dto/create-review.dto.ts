import { IsInt, IsNotEmpty, IsOptional, IsString, Min, Max, IsNumber } from 'class-validator';

export class CreateReviewDto  {
  @IsInt({message : 'Rating must be an integer'} )
  @Min(1, {message : 'Rating must be at least 1'})
  @Max(5, {message : 'Rating must be at most 5'})
  rating: number;

  @IsString({message : 'Comment must be a string'})
  @IsOptional({message : 'Comment is optional'})
  comment?: string ;

  // @IsInt({message : 'User Id must be an integer'})

  // @IsNotEmpty({message : 'Product Id is required'})
  // @IsNumber({},{message : 'Product Id must be a valid number'})
  // productId: number;
}
