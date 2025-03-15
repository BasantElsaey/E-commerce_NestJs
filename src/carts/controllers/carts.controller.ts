import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CartService } from '../services/carts.service';
import { CreateCartDto } from '../dto/create-cart.dto';
import { UpdateCartDto } from '../dto/update-cart.dto';
import { CurrentUser } from 'src/utility/common/decorators/current-user.decorator';
import { User } from 'src/users/models/user.model';
import { AuthGuard } from '@nestjs/passport';
import { Cart } from '../models/cart.model';

@Controller('carts')
@UseGuards(AuthGuard('jwt')) 
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add-cart-item')
  async addItemToCart(
    @Body() createCartDto: CreateCartDto, 
    @CurrentUser() currentUser: User
  ): Promise<{ message: string; cartItem: Cart }> {
    return await this.cartService.addItemToCart(createCartDto, currentUser);
  }

  @Get()
  async getCartItems(@CurrentUser() currentUser: User): 
  Promise<{ cartItems: Cart[]; totalPrice: number }> {
    return await this.cartService.getCartItems(currentUser);
  }

  @Patch('/update-cart-item/:id')
  async updateCartItem(
    @Param('id') id: number, 
    @Body() updateCartDto: UpdateCartDto, 
    @CurrentUser() currentUser: User
  ): Promise<{ message: string; cartItem: Cart }> {
    return await this.cartService.updateCartItem(+id, updateCartDto, currentUser);
  }

  @Delete('/delete-cart-item/:id')
  async removeCartItem(
    @Param('id') id: number, 
    @CurrentUser() currentUser: User
  ): Promise<{ message: string }> {
    return await this.cartService.removeCartItem(id, currentUser);
  }

  @Delete('clear-cart')
  async clearCart(@CurrentUser() currentUser: User): Promise<{ message: string }> {
    return await this.cartService.clearCart(currentUser);
  }


  @Get('validate')
  async validateCart(@CurrentUser() currentUser: User): Promise<{ message: string }> {
    return await this.cartService.validateCart(currentUser);
  }

  @Post('checkout')
  async checkout(@CurrentUser() currentUser: User): Promise<{ message: string, orderId: number }> {
    return await this.cartService.checkout(currentUser);
  }
}
