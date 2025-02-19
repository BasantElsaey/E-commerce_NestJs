import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CurrentUser } from 'src/utility/decorators/current-user.decorator';
import { User } from 'src/users/models/user.model';
import { AuthenticationGuard } from 'src/utility/guards/authentication.guard';
import { Roles } from 'src/utility/common/user-roles.enum';
import { Category } from 'src/categories/models/category.model';
import { AuthorizationGuard } from 'src/utility/guards/authorization.guard';
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @UseGuards(AuthenticationGuard, AuthorizationGuard([Roles.ADMIN]))
  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto,
  @CurrentUser() currentUser: User) : Promise<Category> {
    return await this.categoriesService.create(createCategoryDto, currentUser);
  }

  @Get()
  async findAll() : Promise<Category[]> {
    return await this.categoriesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) : Promise<Category> {
    return await this.categoriesService.findOne(+id);
  }

  @UseGuards(AuthenticationGuard, AuthorizationGuard([Roles.ADMIN]))
  @Patch(':id')
  async update(@Param('id') id: string, @Body()  
  updateCategoryDto: UpdateCategoryDto) : Promise<{ message: string; category: Category }> {
    return await this.categoriesService.update(
      +id,updateCategoryDto);
  }

  @UseGuards(AuthenticationGuard, AuthorizationGuard([Roles.ADMIN]))
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.categoriesService.remove(+id);
  }
}
