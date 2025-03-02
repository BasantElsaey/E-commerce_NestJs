import { 
  Injectable, ConflictException, 
  InternalServerErrorException, NotFoundException, ForbiddenException 
} from '@nestjs/common';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Product } from '../models/product.model';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/users/models/user.model';
import { Category } from 'src/categories/models/category.model';
import { Op } from 'sequelize';
import { Review } from 'src/reviews/models/review.model';
import { Roles } from 'src/utility/common/enums/user-roles.enum';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product) 
  private readonly productModel: typeof Product) {}

  async create(createProductDto: CreateProductDto, currentUser: User):
   Promise<{ message: string; product: Product }> {
    try {
      const existingProduct = await this.productModel.findOne({
        where: { name: createProductDto.name, userId: currentUser.id },
      });

      if (existingProduct) {
        throw new ConflictException('Product with this name already exists');
      }

      const category = await Category.findByPk(createProductDto.categoryId);
      if (!category) throw new NotFoundException('Category not found');

      const product = await this.productModel.create({
         name : createProductDto.name,
         description : createProductDto.description,
         price : createProductDto.price,
         stock : createProductDto.stock,
         images : createProductDto.images,
         categoryId : createProductDto.categoryId,
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
          { model: Review, attributes: ['id', 'rating', 'comment', 'userId'] },
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

  async update(id: number, updateProductDto: UpdateProductDto, currentUser: User): 
    Promise<{ message: string; product: Product }> {
    try {
      const product = await this.findOne(id);
      
      if (product.userId !== currentUser.id && !currentUser.roles.includes(Roles.ADMIN)) {
        throw new ForbiddenException("You are not allowed to update this product");
      }

      await product.update(updateProductDto);
      await product.save();
      return { message: 'Product updated successfully', product };
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

      if (product.userId !== currentUser.id && !currentUser.roles.includes(Roles.ADMIN)) {
        throw new ForbiddenException('You are not allowed to restore this product');
      }

      await product.restore();
      return { message: 'Product restored successfully', product };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to restore product: ${error.message}`);
    }
  }
}

