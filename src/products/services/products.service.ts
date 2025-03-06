import { 
  Injectable, ConflictException, 
  InternalServerErrorException, NotFoundException, ForbiddenException, 
  Param,
  UploadedFiles,
  BadRequestException
} from '@nestjs/common';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Product } from '../models/product.model';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/users/models/user.model';
import { Category } from 'src/categories/models/category.model';
import { Op, Sequelize } from 'sequelize';
import { Review } from 'src/reviews/models/review.model';
import { Roles } from 'src/utility/common/enums/user-roles.enum';
import { CurrentUser } from 'src/utility/common/decorators/current-user.decorator';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product) 
  private readonly productModel: typeof Product) {}

  async create(
    createProductDto: CreateProductDto,
    categoryId: number,
    images: Express.Multer.File[],
    @CurrentUser() currentUser: User
  ): Promise<{ message: string; product: Product }> {
    try {
      const existingProduct = await this.productModel.findOne({
        where: { name: createProductDto.name, userId: currentUser.id },
      });
  
      if (existingProduct) {
        throw new ConflictException('Product with this name already exists');
      }
  
      const category = await Category.findByPk(categoryId);
      if (!category) throw new NotFoundException('Category not found');
  
      const price = Number(createProductDto.price);
      const stock = Number(createProductDto.stock);
        
      const imageUrls = images.map(file => file.path); 

      const product = await this.productModel.create({
        name: createProductDto.name,
        description: createProductDto.description,
        price,
        stock,
        images: imageUrls, 
        categoryId: category.id,
        userId: currentUser.id,
      } as Product);
  
      return { message: 'Product created successfully', product };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create product: ${error.message}`);
    }
  }
  

  async findAll(
    page: number , limit: number , search?: string, 
    sortBy: string = 'name', sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Promise<{ products: Product[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      const allowedSortFields = ['name', 'price', 'stock', 'createdAt'];
      const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';

      const { rows: products, count: total } = await this.productModel.findAndCountAll({
        where: search ? { name: { [Op.iLike]: `%${search}%` } } : {},
        include: [
          { model: Category, attributes: ['id', 'title'] },
          { model: User, as: 'addedBy', attributes: ['id', 'name', 'email'] },
        ],
        order: [[validSortBy, sortOrder]],
        limit,
        offset,
      });

      return { products, total };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to retrieve products: ${error.message}`);
    }
  }

  async findOne(id: number): Promise<Product> {
    try {
      const product = await this.productModel.findByPk(id, {
        include: [{ 
          model: Category, attributes: ['id', 'title'], }, 
        { model: User, as: 'addedBy', attributes: ['id', 'name', 'email']},
        // { model: Review, attributes: ['id', 'rating', 'comment', 'userId'] },
      ]});

      if (!product) throw new NotFoundException('Product not found');
      return product;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to find product: ${error.message}`);
    }
  }

  async update(id: number, updateProductDto: UpdateProductDto,@CurrentUser() currentUser: User): 
    Promise<{ message: string; product: Product }> {
    try {
      const product = await this.findOne(id);
      
      if (product.userId !== currentUser.id && !currentUser.roles.includes(Roles.ADMIN)) {
        throw new ForbiddenException("You are not allowed to update this product");
      }
      
      const [affectedRows] = await this.productModel.update(updateProductDto, {
        where: { id },
      });
  
      if (affectedRows === 0) {
        throw new BadRequestException('No changes detected, product was not updated.');
      }
  
      const updatedProduct = await this.findOne(id);
      return { message: 'Product updated successfully', product: updatedProduct };
      
    } catch (error) {
      throw new InternalServerErrorException(`Failed to update product: ${error.message}`);
    }
  }

  async remove(id: number, currentUser: User): Promise<{ message: string; product: Product }> {
    try {
      const product = await this.findOne(id);

      if (product.userId !== currentUser.id && !currentUser.roles.includes(Roles.ADMIN)) {
        throw new ForbiddenException("You are not allowed to delete this product");
      }

      await product.destroy();
      return { message: 'Product deleted successfully', product };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to delete product: ${error.message}`);
    }
  }

  // Restore a deleted product
  async restore(id: number, currentUser: User): 
  Promise<{ message: string; product: Product }> {
    try {
      const product = await this.productModel.findOne({
        where: { id },
        paranoid: false, // retrieve the deleted product
      });

      if (!product) throw new NotFoundException('Product not found');

      if(!product.deletedAt) throw new BadRequestException('Product is not deleted');

      if (product.userId !== currentUser.id && !currentUser.roles.includes(Roles.ADMIN)) {
        throw new ForbiddenException('You are not allowed to restore this product');
      }

      await product.restore();
      return { message: 'Product restored successfully', product };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to restore product: ${error.message}`);
    }
  }

  // // find all deleted products
  // async findDeleted(): Promise<Product[]> {
  //   try {
  //     const deletedProducts = await this.productModel.scope("deleted").findAll();
       
  //     console.log("Deleted products:", deletedProducts);
  //     return deletedProducts;
  //   } catch (error) {
  //     throw new InternalServerErrorException(
  //       `Failed to find deleted products: ${error.message}`
  //     );
  //   }
  // }
  

  // // toggle status of a product 
  // // change from available to not available and vice versa
  async toggleStatus(id: number, currentUser: User):
   Promise<{ message: string; product: Product }> {
    try {
      const product = await this.findOne(id);

      if (!product) throw new NotFoundException('Product not found');

      if (product.userId !== currentUser.id && !currentUser.roles.includes(Roles.ADMIN)) {
        throw new ForbiddenException("You are not allowed to toggle status of this product");
      }

      product.isAvailable = !product.isAvailable;
      await product.save();

      return { message: 'Product status toggled successfully', product };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to toggle product status: ${error.message}`);
    }
  }
}

