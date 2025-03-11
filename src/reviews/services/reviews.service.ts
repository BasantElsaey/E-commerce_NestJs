import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Review } from '../models/review.model';
import { CreateReviewDto } from '../dto/create-review.dto';
import { Product } from 'src/products/models/product.model';
import { User } from 'src/users/models/user.model';
import { Roles } from 'src/utility/common/enums/user-roles.enum';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { CurrentUser } from 'src/utility/common/decorators/current-user.decorator';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review) private readonly reviewModel: typeof Review,
  ) {}

  async create(
    createReviewDto: CreateReviewDto,
    @CurrentUser()currentUser: User,
    productId: number
  ): Promise<{ message: string; review: Review }> {
   
      const product = await Product.findByPk(productId);
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const existingReview = await this.reviewModel.findOne({
        where: { productId, userId: currentUser.id }
      });

      if (existingReview) {
        throw new ConflictException('You have already reviewed this product');
      }

      if (createReviewDto.rating < 1 || createReviewDto.rating > 5) {
        throw new BadRequestException('Rating must be between 1 and 5');
      }

      const review = await this.reviewModel.create({
        rating: createReviewDto.rating,
        comment: createReviewDto.comment || '',
        productId,
        userId: currentUser.id
      } as Review);
     
      return { message: 'Review created successfully', review };
  }

  async findAllReviewsToProduct(productId: number): Promise<{ reviews: Review[], averageRating: number }> {
    const reviews = await this.reviewModel.findAll({
      where: { productId },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
    });

    if (reviews.length === 0) {
      throw new NotFoundException('No reviews found for this product');
    }

    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    return { reviews, averageRating: parseFloat(averageRating.toFixed(2)) };
  }

  async getUserReviews(userId: number): Promise<Review[]> {

      const reviews = await this.reviewModel.findAll({
        where: { userId }, 
        include: [
          {
            model: Product,
            attributes: ['id', 'name', 'price'],
          },
        ],
        order: [['createdAt', 'DESC']], 
      });
  
      return reviews;
  }
  

  async findAllReviews(): Promise<Review[]> {
      const reviews = await this.reviewModel.findAll({
      include: [
        { model: Product, attributes: ['id', 'name', 'price'] },
        { model: User, attributes: ['id', 'name', 'email'] },
      ],
     })
     if (reviews.length === 0) throw new NotFoundException('No reviews found');
     return reviews;
  }

  async getUserReviewsSummary(userId: number): Promise<{ reviews: Review[], averageRating: number }> {
    const reviews = await this.reviewModel.findAll({ where: { userId } });
    
    if (reviews.length === 0) throw new NotFoundException('No reviews found for this user');

    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    return { reviews, averageRating: parseFloat(averageRating.toFixed(2)) };
  }

  async update(id: number, fields: Partial<UpdateReviewDto>, currentUser: User): Promise<{ message: string; review: Review }> {
    const review = await this.reviewModel.findByPk(id);
    if (!review) throw new NotFoundException('Review not found');

    if (review.userId !== currentUser.id && !currentUser.roles.includes(Roles.ADMIN)) {
      throw new ForbiddenException('You are not allowed to update this review');
    }

    if (!fields || Object.keys(fields).length === 0) {
      throw new InternalServerErrorException('No valid fields provided for update');
    }

    await review.update(fields);
    await review.save();
    return { message: 'Review updated successfully', review };
  }


  async remove(id: number, currentUser: User): Promise<{ message: string , data : {}}> {
    const review = await this.reviewModel.findByPk(id);
    if (!review) throw new NotFoundException('Review not found');

    if (review.userId !== currentUser.id && !currentUser.roles.includes(Roles.ADMIN)) {
      throw new ForbiddenException('You are not allowed to delete this review');
    }

    await review.destroy();
    return { message: 'Review deleted successfully',data : {} };
  }

}
