import { Table, Column, Model, ForeignKey, BelongsTo, DataType } from 'sequelize-typescript';
import { User } from 'src/users/models/user.model';
import { Product } from 'src/products/models/product.model';


@Table({ tableName: 'carts' })
export class Cart extends Model {
  @ForeignKey(() => User)
  userId: number;

  @ForeignKey(() => Product)
  @Column
  productId: number;

  @Column({ defaultValue: 1, type: DataType.INTEGER, allowNull: false })
  quantity: number;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Product)
  product: Product;
}
