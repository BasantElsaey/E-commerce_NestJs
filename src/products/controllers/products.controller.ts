import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Product } from '../models/product.model';
import { CurrentUser } from 'src/utility/common/decorators/current-user.decorator';
import { User } from 'src/users/models/user.model';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService 
  ) {}

  @Post()
  async create(@Body() createProductDto: CreateProductDto,
   @CurrentUser() currentUser: User
   ) : Promise<Product> {
    const product = await this.productsService.create
    (createProductDto, currentUser);
    return product
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
