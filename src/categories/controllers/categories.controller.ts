import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CurrentUser } from 'src/utility/common/decorators/current-user.decorator';
import { User } from 'src/users/models/user.model';
import { Category } from 'src/categories/models/category.model';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuthorizeRoles } from 'src/utility/common/decorators/authorize-roles.decorator'; 
import { Roles } from 'src/utility/common/enums/user-roles.enum';
import { AuthGuard } from '@nestjs/passport';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}


  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  async create(@Body() createCategoryDto: CreateCategoryDto, @CurrentUser() currentUser: User): Promise<Category> {
   
    return await this.categoriesService.create(createCategoryDto, currentUser);
  }

  @Get()
  async findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('search') search?: string): Promise<{ categories: Category[]; total: number }> {
    return await this.categoriesService.findAll(+page, +limit, search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Category> {
    return await this.categoriesService.findOne(+id);
  }


  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto): Promise<{ message: string; category: Category }> {
    return await this.categoriesService.update(+id, updateCategoryDto);
  }

 
  @Delete('/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  async remove(@Param('id') id: string) : Promise<{ message: string }> {
    return await this.categoriesService.remove(+id);
  }

  @Get('/user/:userId')
  async findAllCategoriesToSpecificUser(@Param('userId') userId: number): Promise<Category[]> {
    return await this.categoriesService.findAllCategoriesToSpecificUser(userId);
  }
}
