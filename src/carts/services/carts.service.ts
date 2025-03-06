import { Injectable, NotFoundException, ConflictException, ForbiddenException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cart } from '../models/cart.model';
import { CreateCartDto } from '../dto/create-cart.dto';
import { UpdateCartDto } from '../dto/update-cart.dto';
import { User } from 'src/users/models/user.model';
import { Product } from 'src/products/models/product.model';
import { CurrentUser } from 'src/utility/common/decorators/current-user.decorator';
import { Order } from 'src/orders/models/order.model';
import { Op } from 'sequelize';

@Injectable()
export class CartService {
  constructor(@InjectModel(Cart) private readonly cartModel: typeof Cart) {}

  async addItemToCart(createCartDto: CreateCartDto, @CurrentUser() currentUser: User)
    : Promise<{ message: string; cartItem: Cart }> {
    try {
      const product = await Product.findByPk(createCartDto.productId);
      if (!product) throw new NotFoundException('Product not found');
      
      // check if quantity is greater than stock 
      if (createCartDto.quantity > product.stock) {
        throw new BadRequestException(`Only ${product.stock} items available in stock`);
      }

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
    } catch (error) {
      throw new InternalServerErrorException(`Error adding item to cart: ${error.message}`);
    }
  }

  async getCartItems(@CurrentUser() currentUser: User) 
    : Promise<{ cartItems: any[]; totalPrice: number, cartCount : number }> {
      try {
    const cartItems = await this.cartModel.findAll({
      where: { userId: currentUser.id },
      include: [
        { model: Product, attributes: ['id', 'name', 'price', 'images'] },
        {model : User, attributes: ['id', 'name', 'email']}
      ]
    });

    const totalPrice = cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

    return { 
      cartItems: cartItems.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        price: item.product.price,
        image: item.product.images,
        quantity: item.quantity,
        user : item.user
      })),
      totalPrice ,
      cartCount : cartItems.length

      //  cartCount : await this.cartModel.count({ where: { userId: currentUser.id } })
  
    };
  } catch (error) {
    throw new InternalServerErrorException(`Error getting cart items: ${error.message}`);
  }
  }

  async updateCartItem(itemId: number, updateCartDto: UpdateCartDto, @CurrentUser() currentUser: User)
    : Promise<{ message: string; cartItem: Cart }> {
     try {
    const cartItem = await this.cartModel.findByPk(+itemId, { include: [Product] });
    if (!cartItem) throw new NotFoundException('Cart item not found');

    if (cartItem.userId !== currentUser.id) throw new ForbiddenException('Not allowed to update this item');

    if (updateCartDto.quantity > cartItem.product.stock) {
      throw new BadRequestException(`Only ${cartItem.product.stock} items available in stock`);
    }

    const [affectedRows] = await this.cartModel.update(updateCartDto, {
      where: { id: itemId },
    });

    if (affectedRows === 0) throw new BadRequestException
    ('No changes detected, cart item was not updated');

    await cartItem.update({ quantity: updateCartDto.quantity });
    await this.validateCart(currentUser);
    await cartItem.save();

    return { message: 'Cart item updated successfully', cartItem };
  }catch (error) {
    throw new InternalServerErrorException(`Error updating cart item: ${error.message}`);
  }
  }

  // delete a cart item 
  async removeCartItem(itemId: number, @CurrentUser() currentUser: User)
    : Promise<{ message: string, data : any, cartCount : number }> {
   try {
    const cartItem = await this.cartModel.findByPk(itemId);
    if (!cartItem) throw new NotFoundException('Cart item not found');

    if (cartItem.userId !== currentUser.id) throw new ForbiddenException('Not allowed to remove this item');

    await cartItem.destroy();
    await this.validateCart(currentUser);
    return { message: 'Cart item removed successfully',
      data : {} , cartCount : await this.cartModel.count({ where: { userId: currentUser.id } })
    };
   }catch (error) {
    throw new InternalServerErrorException(`Error removing cart item: ${error.message}`);
   }
  }

  // clear all carts
  async clearCart(@CurrentUser() currentUser: User) : Promise<{ message: string,
    data : any, cartCount : number
   }> {
    try {
    const cartItems = await this.cartModel.findAll({ where: { userId: currentUser.id } });
    if (cartItems.length === 0) throw new NotFoundException('Cart is empty');

    await this.cartModel.destroy({ where: { userId: currentUser.id } });
    return { message: 'Cart cleared successfully', data : {} , cartCount : await this.cartModel.count({ where: { userId: currentUser.id } })
   };
    }catch(error){
      throw new InternalServerErrorException(`Error clearing cart: ${error.message}`);
    }
  }
  
  // check if cart is valid before checkout
  async validateCart(@CurrentUser() currentUser: User): Promise<{ valid: boolean; message: string }> {
    try{
    
    const cartItems = await this.cartModel.findAll({ 
      where: { userId: currentUser.id, quantity: { [Op.gt]: 0 } },
      include: [{ model: Product, attributes: ['id', 'name', 'price', 'stock'] }]
    });

    if (cartItems.length === 0) throw new NotFoundException('Cart is empty');

    for (const item of cartItems) {
      if (item.quantity > item.product.stock) {
        return { 
          valid: false, 
          message: `Insufficient stock for product ${item.product.name}, only ${item.product.stock} available.` 
        };
      }
    }

    return { valid: true, message: 'Cart is valid' };
  }catch(error){
    throw new InternalServerErrorException(`Error validating cart: ${error.message}`);
  }
  }
}
