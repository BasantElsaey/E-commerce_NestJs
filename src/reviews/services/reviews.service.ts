import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Review } from '../models/review.model';
import { CreateReviewDto } from '../dto/create-review.dto';
import { Product } from 'src/products/models/product.model';
import { User } from 'src/users/models/user.model';
import { Roles } from 'src/utility/common/enums/user-roles.enum';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { Op } from 'sequelize';

@Injectable()
export class ReviewsService {
  constructor(@InjectModel(Review) private readonly reviewModel: typeof Review) {}

  async create(createReviewDto: CreateReviewDto, currentUser: User): Promise<{ message: string; review: Review }> {
    try {
      const product = await Product.findByPk(createReviewDto.productId);
      if (!product) throw new NotFoundException('Product not found');

      const existingReview = await this.reviewModel.findOne({
        where: { productId: createReviewDto.productId, userId: currentUser.id }
      });

      if (existingReview) {
        throw new ConflictException('You have already reviewed this product');
      }

      if (createReviewDto.rating < 1 || createReviewDto.rating > 5) {
        throw new ConflictException('Rating must be between 1 and 5');
      }

      const review = await this.reviewModel.create({
        rating: createReviewDto.rating,
        comment: createReviewDto.comment || '',
        productId: createReviewDto.productId,
        userId: currentUser.id,
      } as Review);

      return { message: 'Review added successfully', review };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to add review: ${error.message}`);
    }
  }

  async findAllReviewsToProduct(productId: number): Promise<{ reviews: Review[], averageRating: number }> {
    const reviews = await this.reviewModel.findAll({
      where: { productId },
      include: [{ model: User, attributes: ['id', 'username', 'email'] }],
    });

    if (reviews.length === 0) {
      throw new NotFoundException('No reviews found for this product');
    }

    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    return { reviews, averageRating: parseFloat(averageRating.toFixed(2)) };
  }

  async findUserReviews(userId: number, currentUser: User): Promise<Review[]> {
    if (currentUser.id !== userId && !currentUser.roles.includes(Roles.ADMIN)) {
      throw new ForbiddenException('You are not allowed to view these reviews');
    }

    return await this.reviewModel.findAll({
      where: { userId },
      include: [{ model: Product, attributes: ['id', 'name'] }],
    });
  }

  async findAllReviews(): Promise<Review[]> {
    return await this.reviewModel.findAll({
      include: [
        { model: Product, attributes: ['id', 'name'] },
        { model: User, attributes: ['id', 'username', 'email'] },
      ],
    });
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


  async remove(id: number, currentUser: User): Promise<{ message: string }> {
    const review = await this.reviewModel.findByPk(id);
    if (!review) throw new NotFoundException('Review not found');

    if (review.userId !== currentUser.id && !currentUser.roles.includes(Roles.ADMIN)) {
      throw new ForbiddenException('You are not allowed to delete this review');
    }

    await review.destroy();
    return { message: 'Review deleted successfully' };
  }

  // search reviews
  async searchReviews(query: string): Promise<Review[]> {
    return await this.reviewModel.findAll({
      where: { comment: { [Op.iLike]: `%${query}%` } },
      include: [{ model: User, attributes: ['id', 'username'] }],
    });
  }
}
