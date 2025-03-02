import { Table, Column, Model, ForeignKey, BelongsTo, DataType } from 'sequelize-typescript';
import { Product } from 'src/products/models/product.model';
import { User } from 'src/users/models/user.model';

@Table({ tableName: 'reviews', timestamps: true, paranoid: true })
export class Review extends Model<Review> {
  
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false })
  productId: number;

  @BelongsTo(() => Product)
  product: Product;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column({ type: DataType.INTEGER, allowNull: false, validate: { min: 1, max: 5 } })
  rating: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  comment: string ;
}
