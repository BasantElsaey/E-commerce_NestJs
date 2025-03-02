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

// @ApiTags('Orders')
// @ApiBearerAuth()
@UseGuards(AuthGuard('jwt'),RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() currentUser: User)
  : Promise<{ message: string; order: Order }> {
    return this.ordersService.create(createOrderDto, currentUser);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  async findAll() : Promise<Order[]> {
    return await this.ordersService.findAll();
  }

 // get all of current user orders
  @Get('myorders')
  async findMyOrders(@CurrentUser() currentUser: User) : Promise<Order[]> {
    return await this.ordersService.findUserOrders(currentUser.id);
  }

  // get order by id
  @Get(':id')
  async findOne(@Param('id') orderId: number, @CurrentUser() currentUser: User)
  : Promise<Order> {
    return this.ordersService.findOne(orderId, currentUser);
  }

  // get order items
  @Get(':id/items')
  async findOrderItems(@Param('id') orderId: number, @CurrentUser() currentUser: User)
  : Promise<OrderItem[]> {
    return this.ordersService.findOrderItems(orderId, currentUser);
  }

  // update order data
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  async update(@Param('id') orderId: number, @Body() updateOrderDto: UpdateOrderDto,
   @CurrentUser() currentUser: User) : Promise<{ message: string; order: Order }> {
    return this.ordersService.update(orderId, updateOrderDto, currentUser);
  }

  // update order status 
  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AuthorizeRoles(Roles.ADMIN)
  async updateStatus(@Param('id') orderId: number, @Body('status') status: string,
  updateOrderDto: UpdateOrderDto) : Promise<{ message: string; order: Order }> {
    return this.ordersService.updateStatus(orderId, status, updateOrderDto);
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
  @Patch(':id/cancel')
  async cancel(@Param('id') orderId: number, @CurrentUser() currentUser : User)
  : Promise<{ message: string; order: Order }> {
    return this.ordersService.cancel(orderId, currentUser);
  }

  // is available only for `cancelled` orders
  @Delete(':id')
  async delete(@Param('id') orderId: number, @CurrentUser() currentUser : User) 
  : Promise<{ message: string }> {
    return this.ordersService.delete(orderId, currentUser);
  }
}
