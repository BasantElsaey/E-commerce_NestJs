import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { UpdateOrderItemDto } from '../dto/update-order-item.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/utility/common/decorators/current-user.decorator';
import { User } from 'src/users/models/user.model';
import { Roles } from 'src/utility/common/enums/user-roles.enum';
// import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthorizeRoles } from 'src/utility/common/decorators/authorize-roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Order } from '../models/order.model';
import { OrderItem } from '../models/order-item.model';


@Controller('orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // @Post('/create-order')
  // async create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() currentUser: User)
  // : Promise<{ message: string; order: Order }> {
  //   return this.ordersService.create(createOrderDto, currentUser);
  // }

  @Post('/create-order-from-cart')
  async createOrderFromCart(@CurrentUser() currentUser: User,userId: number) 
  : Promise<{ message: string; order: Order }> {
    return this.ordersService.createOrderFromCart(userId,currentUser);
  }

 // get all of current user orders
  @Get('my-orders')
  async findMyOrders(@CurrentUser() currentUser: User) : Promise<Order[]> {
    return await this.ordersService.findUserOrders(currentUser);
  }

  @Get()
  @AuthorizeRoles(Roles.ADMIN)
  async findAll(@CurrentUser() currentUser: User) : Promise<Order[]> {
    return await this.ordersService.findAll(currentUser);
  }

  // get order by id
  @Get(':id')
  async findOne(@Param('id') orderId: number, @CurrentUser() currentUser: User)
  : Promise<Order> {
    return this.ordersService.findOne(orderId, currentUser);
  }

  // get order items
  @Get('/items/:id')
  async findOrderItems(@Param('id') orderId: number, @CurrentUser() currentUser: User)
  : Promise<OrderItem[]> {
    return this.ordersService.findOrderItems(orderId, currentUser);
  }

  // update order data
  @Patch('/update-order/:id')
  async update(@Param('id') orderId: number, @Body() updateOrderDto: UpdateOrderDto,
   @CurrentUser() currentUser: User) : Promise<{ message: string; order: Order }> {
    return this.ordersService.update(orderId, updateOrderDto, currentUser);
  }

  // update order status 
  @Patch(':id/status')
  @AuthorizeRoles(Roles.ADMIN)
  async updateStatus(@Param('id') orderId: number, @Body('status') status: string,
  updateOrderDto: UpdateOrderDto) : Promise<{ status : string}> {
    return this.ordersService.updateOrderStatus(orderId, status);
  }

  // update order item quantity
  @Patch(':id/items/:itemId')
  async updateOrderItem(
    @Param('id') orderId: number,
    @Param('itemId') itemId: number,
    @Body() updateOrderItemDto: UpdateOrderItemDto,
    @CurrentUser() currentUser: User
  ) {
    return await this.ordersService.updateOrderItem(orderId, itemId, updateOrderItemDto, currentUser);
  }

  // is available only for `pending` orders
  @Patch('/cancel-order/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async cancel(@Param('id') orderId: number, @CurrentUser() currentUser : User)
  : Promise<{ message: string; order: Order }> {
    return this.ordersService.cancel(orderId, currentUser);
  }

  // is available only for `cancelled` orders
  @Delete('/delete-order/:id')
  async delete(@Param('id') orderId: number, @CurrentUser() currentUser : User) 
  : Promise<{ message: string }> {
    return this.ordersService.delete(orderId, currentUser);
  }
}
