import { Table, Column, Model, DataType, PrimaryKey, HasMany } from 'sequelize-typescript';
import { Category } from '../../categories/models/category.model';
import { Product } from '../../products/models/product.model';
import { Roles } from '../../utility/common/enums/user-roles.enum';
@Table({ tableName: 'users', timestamps: true })
export class User extends Model<User> {
  
  @PrimaryKey
  @Column({ type: DataType.INTEGER, autoIncrement: true})
  id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  name: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  password: string;


  @Column({
    type: DataType.ARRAY(DataType.STRING), 
    allowNull: false,
    defaultValue: [Roles.USER], 
  })
  roles: Roles[];


  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW, // Alternative to CreatedDateColumn
  })
  createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    onUpdate: 'SET DEFAULT', // alternative to UpdateDateColumn
  })
  updatedAt: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  refreshToken: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isEmailVerified: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  twoFactorSecret: string | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isTwoFactorEnabled: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  passwordResetToken : string | null

  @Column({ type: DataType.DATE, allowNull: true })
  passwordResetExpires: Date | null;

  // relations in sequelize
   // one user has many categories 
  @HasMany(() => Category)
  categories: Category[];

  // one user has many products
   @HasMany(() => Product) 
   products: Product[]
}

