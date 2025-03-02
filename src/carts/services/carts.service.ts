import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cart } from '../models/cart.model';
import { CreateCartDto } from '../dto/create-cart.dto';
import { UpdateCartDto } from '../dto/update-cart.dto';
import { User } from 'src/users/models/user.model';
import { Product } from 'src/products/models/product.model';
import { CurrentUser } from 'src/utility/common/decorators/current-user.decorator';

@Injectable()
export class CartService {
  constructor(@InjectModel(Cart) private readonly cartModel: typeof Cart) {}

  async addItemToCart(createCartDto: CreateCartDto, 
    @CurrentUser() currentUser: User) :
   Promise<{ message: string; cartItem: Cart }> {
    const product = await Product.findByPk(createCartDto.productId);
    if (!product) throw new NotFoundException('Product not found');

    const existingItem = await this.cartModel.findOne({
      where: { userId: currentUser.id, productId: createCartDto.productId },
    });

    if (existingItem) {
      throw new ConflictException('Product already in cart, update quantity instead');
    }

    const cartItem = await this.cartModel.create({
      userId: currentUser.id,
      productId: createCartDto.productId,
      quantity: createCartDto.quantity,
    });

    return { message: 'Item added to cart', cartItem };
  }

  async getCartItems(@CurrentUser() currentUser : User) : 
  Promise<{ cartItems: Cart[]; totalPrice: number }> {
    const cartItems = await this.cartModel.findAll({
      where: { userId: currentUser.id },
      include: [Product],
    });

    const totalPrice = cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

    return { cartItems, totalPrice };
  }

  async updateCartItem(itemId: number, updateCartDto: UpdateCartDto, 
    @CurrentUser() currentUser: User) : 
    Promise<{ message: string; cartItem: Cart }> {

    const cartItem = await this.cartModel.findByPk(+itemId);
    if (!cartItem) throw new NotFoundException('Cart item not found');

    if (cartItem.userId !== currentUser.id) throw new ForbiddenException('Not allowed to update this item');

    await cartItem.update({ quantity: updateCartDto.quantity });

    return { message: 'Cart item updated successfully', cartItem };
  }

  async removeCartItem(itemId: number, @CurrentUser() currentUser: User)
  : Promise<{ message: string }> {
     
    const cartItem = await this.cartModel.findByPk(+itemId);
    if (!cartItem) throw new NotFoundException('Cart item not found');

    if (cartItem.userId !== currentUser.id) throw new ForbiddenException('Not allowed to remove this item');

    await cartItem.destroy();
    return { message: 'Cart item removed successfully' };
  }

  async clearCart(@CurrentUser() currentUser: User) : Promise<{ message: string }> {
    const cartItems = await this.cartModel.findAll({ where: { userId: currentUser.id } });
    if (cartItems.length === 0) throw new NotFoundException('Cart is empty');
    await this.cartModel.destroy({ where: { userId: currentUser.id } });
    return { message: 'Cart cleared successfully' };
  }
}
