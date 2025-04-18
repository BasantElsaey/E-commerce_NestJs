import { Injectable, UnauthorizedException, 
BadRequestException, ConflictException, InternalServerErrorException,
NotFoundException, 
OnModuleInit} from '@nestjs/common';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Category } from 'src/categories/models/category.model';
import { User } from 'src/users/models/user.model';
import { Op } from 'sequelize';

@Injectable()
// implements OnModuleInit to make sure that database is not empty before using it
export class CategoriesService implements OnModuleInit {

  constructor(@InjectModel(Category) 
  private readonly categoryModel: typeof Category) {}
async onModuleInit() {
       // usage of onModule to make sure that database is not empty 
       // sending default categories, 
       // otherwise it will throw an error
        const categoryCount = await this.categoryModel.count();
        if (categoryCount === 0) {
          const defaultUserId = 1 ;
          const userExists = await this.categoryModel.sequelize?.models.User.findByPk(defaultUserId);
          if (!userExists) {
            throw new NotFoundException('Default user not found, cannot initialize categories');
          }
    
          await this.categoryModel.bulkCreate([
            { title: 'Electronics', description: 'Electronic devices', userId: defaultUserId },
            { title: 'Clothing', description: 'Fashion and apparel', userId: defaultUserId },
            { title: 'Books', description: 'Books and literature', userId: defaultUserId },
          ]as Category[]);
          console.log('Default categories added successfully');
        } else {
          console.log(`CategoriesService initialized with ${categoryCount} existing categories`);
        }
  }

  async create(createCategoryDto: CreateCategoryDto, currentUser: User): 
  Promise<Category> {
    // Use transactions to ensure data consistency
    const transaction = await this.categoryModel.sequelize?.transaction();
    
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
  }


  // get all categories with pagination and search
  async findAll( page: number, limit: number, search?: string): Promise<{ categories: Category[]; total: number }> {
    // calculate offset to determine which records we start to retrieve data
    // limit determines how many elements to retrieve in each page
    // page determines which page to start to retrieve
    const offset = (page - 1) * limit;

    // where clause determines conditions of search
    // Op.iLike is used for case-insensitive search 
    // %search% is used for wildcard search  
    // --> search for any text that includes input word 
    const whereClause: any = {};
    if (search) {
      whereClause.title = { [Op.iLike]: `%${search}%` }; 
    }

    const { rows: categories, count: total } =
      await this.categoryModel.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'addedBy',
            attributes: ['id', 'name', 'email'],
          },
        ],
        attributes: { exclude: ['password'] },
        limit,
        offset,
      });

    return { categories, total };
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
  async update(id: number, fields: Partial<UpdateCategoryDto>):
  Promise<{ message: string; category: Category }> {
 
   const category = await this.categoryModel.findByPk(id);
 
   if (!category) {
     throw new NotFoundException('Category not found');
   }
  
   // check if any of the fields are undefined or null
   if (!fields || Object.keys(fields).length === 0 || Object.values(fields).every(value => value === undefined || value === null)) {
     throw new InternalServerErrorException('No valid fields provided for update');
   }
     await category.update(fields);
     await category.save(); 
     
     return { message: 'Category updated successfully', category };
 }
 
  async remove(id: number) : Promise<{ message: string }> {
 
    const category = await this.findOne(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await category.destroy();
    await category.save();
    return { message: 'Category deleted successfully'};
    
   
  }

  // get all categories specific to a user
  async findAllCategoriesToSpecificUser(userId: number): Promise<Category[]> {
    const categories = await this.categoryModel.findAll({
      where: { userId },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: User,
          as: 'addedBy',
          attributes: ['id', 'name', 'email'],
        },
      ]
    });

    if (categories.length === 0 || !categories || userId === null) {
      throw new NotFoundException('No categories found for this user or user not found');
    }
    return categories;
  }
}
