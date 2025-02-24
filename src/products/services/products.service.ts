import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Product } from '../models/product.model';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/users/models/user.model';
import { Category } from 'src/categories/models/category.model';


@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product) 
  private readonly productModel: typeof Product) {}
  async create(createProductDto: CreateProductDto, currentUser: User) : Promise<Product> {
    try{
    const existingProduct = await this.productModel.findOne
    ({ where: { name: createProductDto.name , userId: currentUser.id }});

    if (existingProduct) {
      throw new ConflictException('Product with this title already exists');
    }
    const product = await this.productModel.create({
      name: createProductDto.name,
      description: createProductDto.description,
      price: createProductDto.price,
      stock: createProductDto.stock,
      images: createProductDto.images,
      categoryId: createProductDto.categoryId,
      userId: currentUser.id
    } as Product);
     return product;
  } catch (error) {
     throw new InternalServerErrorException(`Failed to create product: ${error.message}`);
  }
}

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
