import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  UseGuards, Query, UseInterceptors, UploadedFile, ParseIntPipe,
  UploadedFiles,
  NotFoundException
} from '@nestjs/common';
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
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { storage } from 'src/utility/cloudinary/cloudinary.config';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('/create-product/:categoryId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  @UseInterceptors(FilesInterceptor('image',5, { storage }))
  async create(
    @Param('categoryId') categoryId: number,
    @Body() createProductDto: any, 
    @UploadedFiles() images: Express.Multer.File[],
    @CurrentUser() currentUser: User
  ): Promise<{ message: string; product: Product }> {
    return await this.productsService.create(createProductDto, categoryId, images, currentUser);
  }
  

  @Get()
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'name',
    @Query('sortOrder') sortOrder: string = 'DESC'
  ): Promise<{ products: Product[]; total: number; page: number; limit: number }> {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const allowedSortFields = ['name', 'price', 'stock'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';

    const { products, total } = await this.productsService.findAll(pageNum, limitNum, search, validSortBy, validSortOrder);
    return { products, total, page: pageNum, limit: limitNum };
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Product> {
    return await this.productsService.findOne(id);
  }

  @Patch('/update-product/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  @UseInterceptors(FilesInterceptor('image',5, { storage }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() image?: Express.Multer.File
  ): Promise<{ message: string; product: Product }> {
    if (image) {
      updateProductDto.images = [image.path]; 
    }
    return await this.productsService.update(id, updateProductDto, currentUser);
  }

  @Delete('/delete-product/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() currentUser: User): Promise<{ message: string; product: Product }> {
    return await this.productsService.remove(id, currentUser);
  }

  @Patch('/restore-deleted-product/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  async restore(@Param('id') id: number, @CurrentUser() currentUser: User): Promise<{ message: string; product: Product }> {
    return await this.productsService.restore(id, currentUser);
  }

  // @Get('/deleted-products')
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @AuthorizeRoles(Roles.ADMIN)
  // async findDeleted(): Promise<{ deletedProducts: Product[] }> {
  //   const deletedProducts = await this.productsService.findDeleted();
    
  //   console.log('Deleted Products:', deletedProducts);
  
  //   return { deletedProducts };
  // }


  @Patch('/toggle-status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  async toggleStatus(@Param('id') id: number, @CurrentUser() currentUser: User): Promise<{ message: string; product: Product }> {
    return await this.productsService.toggleStatus(id, currentUser);
  }
}
