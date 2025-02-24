import { Table, Model, Column, DataType, PrimaryKey, ForeignKey, BelongsTo, HasOne, HasMany } from "sequelize-typescript";
import { User } from "src/users/models/user.model";
import { Product } from "src/products/models/product.model";


@Table({tableName: 'categories', timestamps: true, paranoid: true})
export class Category extends Model<Category> {

    @PrimaryKey
    @Column({type: DataType.INTEGER, autoIncrement: true})
    id: number;

    @Column({type: DataType.STRING, allowNull: false})
    title: string;

    @Column({type: DataType.STRING, allowNull: false})
    description: string

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
      
      @Column({ type: DataType.DATE})
      deletedAt: Date ;

      // Relationship between category and user
      @ForeignKey(() => User) 
      // @Column({type: DataType.INTEGER, allowNull: false})
      userId: number
       
      @BelongsTo(() => User, {as : 'addedBy'})
      user: User

      // Relationship between category and product
      @HasMany(() => Product)
      products: Product[]
    
    }
    

