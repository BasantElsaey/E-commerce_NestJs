import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { User } from 'src/users/models/user.model';
import { OrderItem } from './order-item.model';

@Table({ tableName: 'orders', timestamps: true })
export class Order extends Model<Order> {
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  id: number;

  @ForeignKey(() => User)
  @Column({ allowNull: false, type: DataType.INTEGER })
  userId: number;

  @Column({ allowNull: false, type: DataType.ENUM('pending', 'processing', 'shipped', 'delivered', 'canceled'), defaultValue: 'pending' })
  status: string;

  @Column({ allowNull: false, type: DataType.FLOAT })
  totalPrice: number;

  @BelongsTo(() => User)
  user: User;

  @HasMany(() => OrderItem)
  items: OrderItem[];
}
