import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Roles } from 'src/utility/common/user-roles.enum';
@Table({ tableName: 'users', timestamps: true })
export class User extends Model<User> {
  
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
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


 
}

