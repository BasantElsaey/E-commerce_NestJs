import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ReviewsService } from '../services/reviews.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { User } from 'src/users/models/user.model';
import { Roles } from 'src/utility/common/enums/user-roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuthorizeRoles } from 'src/utility/common/decorators/authorize-roles.decorator';
import { CurrentUser } from 'src/utility/common/decorators/current-user.decorator';
import { Review } from '../models/review.model';
import { AuthGuard } from '@nestjs/passport';

@Controller('reviews')
@UseGuards(AuthGuard('jwt'), RolesGuard) 
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  async create(@Body() createReviewDto: CreateReviewDto, @CurrentUser() currentUser : User)
  : Promise<{ message: string; review: Review }> {
    return await this.reviewsService.create(createReviewDto,currentUser);
  }

  @Get('product/:productId')
  async findAllReviewsToProduct(@Param('productId') productId: number)
  : Promise<{ reviews: Review[], averageRating: number }> {
    return await this.reviewsService.findAllReviewsToProduct(productId);
  }

  @Get('user/:userId')
  async findUserReviews(@Param('userId') userId: number, @CurrentUser() currentUser: User) {
    return await this.reviewsService.findUserReviews(userId, currentUser);
  }

  @Get('all-reviews')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  async findAllReviews(): Promise<Review[]> {
    return await this.reviewsService.findAllReviews();
  }

  @Get('user-summary/:userId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  async getUserReviewsSummary(@Param('userId') userId: number): 
  Promise<{ reviews: Review[], averageRating: number }> {
    return await this.reviewsService.getUserReviewsSummary(userId);
  }

  @Get('/search')
  async searchReviews(@Query('query') query: string): Promise<Review[]> {
    return await this.reviewsService.searchReviews(query);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateReviewDto: UpdateReviewDto,
   @CurrentUser() currentUser: User) {
    return await this.reviewsService.update(id, updateReviewDto, currentUser);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return await this.reviewsService.remove(id, currentUser);
  }
}
