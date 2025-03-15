import { forwardRef, Module } from '@nestjs/common';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './models/product.model';
import { Category } from 'src/categories/models/category.model';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Product,Category]),
    // circular dependency
    forwardRef(() => OrdersModule),
],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService]
})
export class ProductsModule {}
