import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
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
import { LazyModuleLoader } from '@nestjs/core';

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly lazyModuleLoader: LazyModuleLoader
  ) {}


  @Post('/create-review/:productId')
  @UseGuards(AuthGuard('jwt'), RolesGuard) 
  async create(
    @Body() createReviewDto: CreateReviewDto,
    @Param('productId', ParseIntPipe) productId: number,
   @CurrentUser() currentUser : User)
  : Promise<{ message: string; review: Review }> {
    // usage of lazy loading --> to make sure
    //  that the module is loaded only when it is needed
    const {ReviewsModule} = await import ('src/reviews/reviews.module');
    const moduleRef = await this.lazyModuleLoader.load(() => ReviewsModule);
    const reviewsService = moduleRef.get('ReviewsService');
    const result = await reviewsService.create(createReviewDto,currentUser, productId);
    return result;
  }

  @Get('product/:productId')
  async findAllReviewsToProduct(@Param('productId') productId: number)
  : Promise<{ reviews: Review[], averageRating: number }> {
    // usage of lazy loading
     const {ReviewsModule} = await import ('src/reviews/reviews.module');
    const moduleRef = await this.lazyModuleLoader.load(() => ReviewsModule);
    const reviewsService = moduleRef.get('ReviewsService');
    const result = await reviewsService.findAllReviewsToProduct(productId);
    return result;

  }

  @Get('/my-reviews')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async getUserReviews(@CurrentUser() currentUser : User) : Promise<Review[]> {
    return await this.reviewsService.getUserReviews(currentUser.id);
  }

  @Get('all-reviews')
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @AuthorizeRoles(Roles.ADMIN)
  async findAllReviews(): Promise<Review[]> {
    // usage of lazy loading
    const {ReviewsModule} = await import ('src/reviews/reviews.module');
    const moduleRef = await this.lazyModuleLoader.load(() => ReviewsModule);
    const reviewsService = moduleRef.get('ReviewsService');
    const result = await reviewsService.findAllReviews();
    return result;
  }

  @Get('user-summary/:userId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  async getUserReviewsSummary(@Param('userId') userId: number): 
  Promise<{ reviews: Review[], averageRating: number }> {
    return await this.reviewsService.getUserReviewsSummary(userId);
  }

  @Patch('/update-review/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async update(@Param('id') id: number, @Body() updateReviewDto: UpdateReviewDto,
   @CurrentUser() currentUser: User) {
    return await this.reviewsService.update(id, updateReviewDto, currentUser);
  }

  @Delete('/delete-review/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return await this.reviewsService.remove(id, currentUser);
  }
}
