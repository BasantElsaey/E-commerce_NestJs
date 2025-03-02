import { IsNotEmpty, IsNumber, IsPositive, IsString,Min,IsArray } from "class-validator";
export class CreateProductDto {

    @IsNotEmpty({message : 'Name is required' })
    @IsString({message : 'Name must be a string' })
    name: string;

    @IsNotEmpty({message : 'Description is required' })
    @IsString({message : 'Description must be a string' })
    description: string;

    @IsNotEmpty({message : 'Price is required' })
    @IsNumber
        ({maxDecimalPlaces: 2}, 
        {message : 'Price must be a number with up to 2 decimal precisions' })
    @IsPositive({message : 'Price must be a positive number' })
    price: number;

    @IsNotEmpty({message : 'Stock is required' })
    @IsNumber({}, {message : 'Stock must be a number' })
    @Min(0, {message : 'Stock cannot be a negative number' })
    stock: number;

    @IsNotEmpty({message : 'Images are required' })
    @IsArray({message : 'Images must be an array' })
    images: string[];

    @IsNotEmpty({message : 'Category is required' })
    @IsNumber({}, {message : 'Category Id must be a number' })
    categoryId : number

}
