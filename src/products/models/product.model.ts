import { 
    Column, PrimaryKey, Table, DataType,
     Model, ForeignKey, BelongsTo 
    } from "sequelize-typescript";
import { Category } from "src/categories/models/category.model";
import { User } from "src/users/models/user.model";

@Table({tableName : 'products', timestamps: true, paranoid: true})
export class Product extends Model<Product> {

    @PrimaryKey
    @Column({type: DataType.INTEGER, autoIncrement: true})
    id: number;

    @Column({type: DataType.STRING, allowNull: false})
    name: string;

    @Column({type: DataType.STRING, allowNull: false})
    description: string;

    @Column({type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0})
    price: number;

    @Column({type: DataType.INTEGER, allowNull: false})
    stock: number

    @Column({
        type: DataType.ARRAY(DataType.STRING), 
        allowNull: false,
        defaultValue: []
    })
    images: string[]

    @Column({
        type: DataType.DATE, 
        allowNull: false, 
        defaultValue: DataType.NOW
    })
    createdAt: Date

    @Column({
        type: DataType.DATE, 
        allowNull: false, 
        defaultValue: DataType.NOW, 
        onUpdate: 'SET DEFAULT'
    })
    updatedAt: Date

    @Column({type: DataType.DATE})
    deletedAt: Date // Soft delete

    // Relationship between Product and Category
    @ForeignKey(() => Category)
    @Column({type: DataType.INTEGER, allowNull: false})
    categoryId: number
     
    @BelongsTo(() => Category)
    category: Category

    // Relationship between Product and User
    @ForeignKey(() => User)
    @Column({type: DataType.INTEGER, allowNull: false})
    userId: number

    @BelongsTo(() => User, {as : 'addedBy'})
    user: User

}
