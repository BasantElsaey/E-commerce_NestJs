import { Column, ForeignKey, Table, Model, BelongsTo } from 'sequelize-typescript';
import { Cart } from './cart.model';
import { Product } from '../../products/models/product.model';

@Table({ tableName: 'cart_items', timestamps: false })
export class CartItem extends Model {
  @ForeignKey(() => Cart)
  @Column
  cartId: number;

  @ForeignKey(() => Product)
  @Column
  productId: number;

  @Column({ allowNull: false, defaultValue: 1 })
  quantity: number;

  @BelongsTo(() => Cart)
  cart: Cart;

  @BelongsTo(() => Product)
  product: Product;
}
