import { Table, Column, Model, ForeignKey, DataType } from 'sequelize-typescript';
import { Order } from '../../orders/models/order.model';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'payments', timestamps: true })
export class Payment extends Model {
  @Column({ type: DataType.STRING, primaryKey: true })
  paymentIntentId: string; // يتم تخزينه كـ String

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER })
  orderId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER })
  userId: number;

  @Column({ type: DataType.ENUM('pending', 'succeeded', 'failed', 'canceled', 'refunded') })
  status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded' ;

  @Column({ type: DataType.INTEGER })
  amount: number; 

  @Column({ type: DataType.STRING })
  currency: string; // eur or usd

  @Column({ type: DataType.STRING, allowNull: false })
  method: string;
  
  @Column({ type: DataType.JSON, allowNull: true })
  metadata: any; 
}
