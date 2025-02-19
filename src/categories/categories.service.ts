import { Injectable, UnauthorizedException, 
BadRequestException, ConflictException, InternalServerErrorException,
NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Category } from 'src/categories/models/category.model';
import { User } from 'src/users/models/user.model';



@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category) 
  private readonly categoryModel: typeof Category) {}

  // async create(createCategoryDto: CreateCategoryDto, currentUser: User): 
  // Promise<Category> {
  //   try {
  //     // check if title and description are provided
  //     if (!createCategoryDto.title || !createCategoryDto.description) {
  //       throw new BadRequestException('Title and description are required');
  //     }

  //     // check if user is authenticated
  //     if (!currentUser || !currentUser.id) {
  //       throw new UnauthorizedException('User not authenticated');
  //     }

  //     // check if category with the same title already exists
  //     const existingCategory = await this.categoryModel.findOne({
  //       where: { title: createCategoryDto.title, userId: currentUser.id },
  //     });

  //     if (existingCategory) {
  //       throw new ConflictException('Category with this title already exists');
  //     }

  //     // create category
  //     const category = new this.categoryModel({
  //       title: createCategoryDto.title,
  //       description: createCategoryDto.description,
  //       userId: currentUser.id,
  //     } as Category);

  //     await category.save();
  //     return category;

  //   } catch (error) {
  //      // handle errors in case of a database error
  //     throw new InternalServerErrorException(
  //       `Failed to create category: ${error.message}`);
  //   }
  // }

  async create(createCategoryDto: CreateCategoryDto, currentUser: User): 
  Promise<Category> {
    // Use transactions to ensure data consistency
    const transaction = await this.categoryModel.sequelize?.transaction();
    try {
      if (!transaction) {
        throw new InternalServerErrorException('Transaction could not be started');
      }

      const existingCategory = await this.categoryModel.findOne({
          where: { title: createCategoryDto.title, userId: currentUser.id },
      });
      
      if (existingCategory) {
        throw new ConflictException('Category with this title already exists');
      }

      const category = await this.categoryModel.create(
        {
          title: createCategoryDto.title,
          description: createCategoryDto.description,
          userId: currentUser.id,
        } as Category,
        { transaction }
       
      );

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      await transaction.commit();
      return category;

    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      throw new InternalServerErrorException(`Failed to create category: ${error.message}`);
    }
  }



    async findAll() : Promise<Category[]> {

      return await this.categoryModel.findAll({
        include: [
          {
            model: User,
            as: 'addedBy',
            attributes: ['id', 'name', 'email'],
          },
        ],
        attributes: { exclude: ['password'] },

      }); // return all categories
    }


  async findOne(id: number) : Promise<Category> {
    const category = await this.categoryModel.findOne(
      { where: { id },
      attributes : {exclude: ['password']},
      include: { 
        model: User, 
        as : 'addedBy',
        attributes: ['id', 'name', 'email'],
      }
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
    
  }

  async update(id: number, fields : Partial<UpdateCategoryDto>) :
   Promise<{ message: string; category: Category }> {
    const category = await this.findOne(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    try {
      await category.update(fields);
      return { message: 'Category updated successfully', category };
      
    } catch (error) {
      throw new InternalServerErrorException(`Failed to update category: ${error.message}`);
    }
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await category.destroy();
    return { message: 'Category deleted successfully' };
  }
}
