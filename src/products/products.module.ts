import { Module } from '@nestjs/common';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './models/product.model';

@Module({
  imports: [SequelizeModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService]
})
export class ProductsModule {}
