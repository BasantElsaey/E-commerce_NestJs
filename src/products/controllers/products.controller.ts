import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Product } from '../models/product.model';
import { CurrentUser } from 'src/utility/common/decorators/current-user.decorator';
import { User } from 'src/users/models/user.model';
import { AuthorizeRoles } from 'src/utility/common/decorators/authorize-roles.decorator';
import { Roles } from 'src/utility/common/enums/user-roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService 
  ) {}


  @Post('/create-product')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() currentUser: User
  ): Promise<{ message: string; product: Product }> {
    const product = await this.productsService.create(createProductDto, currentUser);
    return product;
  }


  @Get()
async findAll(
  @Query('page') page: number ,
  @Query('limit') limit: number ,
  @Query('search') search: string ,
  @Query('sortBy') sortBy: string, 
  @Query('sortOrder') sortOrder: string = 'DESC'  
): Promise<{ products: Product[]; total: number; page: number; limit: number }> {
  
  // check if sort order is valid --> ASC or DESC
  const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const allowedSortFields = ['name', 'price', 'stock'];
  const validSortBy = allowedSortFields.includes(sortBy)

  const { products, total } = await this.productsService.findAll(page, limit, search, validSortBy ? sortBy : 'name', validSortOrder as 'ASC' | 'DESC');
  return { products, total, page, limit };
}


  @Get(':id')
  async findOne(@Param('id') id: string) : Promise<Product> {
    return await this.productsService.findOne(+id);
  }

  @Patch('/update-product/:id')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  async update(@Param('id') id: string,@CurrentUser() currentUser: User,
   @Body() updateProductDto: UpdateProductDto) : Promise<{ message: string; product: Product }> {
    return await this.productsService.update(+id, updateProductDto, currentUser);
  }

  @Delete('/delete-product/:id')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User): 
  Promise<{ message: string, product: Product }> {
    return await this.productsService.remove(+id, currentUser);
  }

  @Patch('/restore-deleted-product/:id')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  async restore(@Param('id') id: string, @CurrentUser() currentUser: User):
   Promise<{ message: string; product: Product }> {
    return await this.productsService.restore(+id, currentUser);
  }
}
