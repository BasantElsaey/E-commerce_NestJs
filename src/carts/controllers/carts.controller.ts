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

  @Post()
  async addItemToCart(@Body() createCartDto: CreateCartDto, @CurrentUser() 
  currenUser: User) : Promise<{ message: string; cartItem: Cart }> {
    return this.cartService.addItemToCart(createCartDto, currenUser);
  }

  @Get()
  async getCartItems(@CurrentUser() currentUser: User)
   : Promise<{ cartItems: Cart[]; totalPrice: number }> {
    return this.cartService.getCartItems(currentUser);
  }

  @Patch(':id')
  async updateCartItem(@Param('id') id: number, @Body() 
  updateCartDto: UpdateCartDto, @CurrentUser() currentUser: User)
  : Promise<{ message: string; cartItem: Cart }> {
    return this.cartService.updateCartItem(+id, updateCartDto, currentUser);
  }

  @Delete(':id')
  async removeCartItem(@Param('id') id: number, @CurrentUser() currentUser: User)
  : Promise<{ message: string }> {
    return this.cartService.removeCartItem(+id, currentUser);
  }

  @Delete('clear-cart')
  async clearCart(@CurrentUser() currentUser: User): Promise<{ message: string }> {
    return this.cartService.clearCart(currentUser);
  }
}
