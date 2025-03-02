import { 
  Injectable, NotFoundException, ForbiddenException, ConflictException, InternalServerErrorException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from '../models/order.model';
import { OrderItem } from '../models/order-item.model';
import { User } from 'src/users/models/user.model';
import { Product } from 'src/products/models/product.model';
import { Roles } from 'src/utility/common/enums/user-roles.enum';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { UpdateOrderItemDto } from '../dto/update-order-item.dto';

@Injectable()
export class OrdersService {
  constructor(@InjectModel(Order) private readonly orderModel: typeof Order) {}

  async create(createOrderDto: CreateOrderDto, currentUser: User)
  : Promise<{ message: string; order: Order }> {
    try {
      let totalPrice = 0;

      const items = await Promise.all(
        createOrderDto.items.map(async (item) => {
          const product = await Product.findByPk(item.productId);
          if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

          totalPrice += product.price * item.quantity;
          return { ...item, price: product.price };
        })
      );

      const order = await this.orderModel.create({ 
        userId: currentUser.id,
        status: 'pending',
        totalPrice
      } as Order);  

      await OrderItem.bulkCreate(items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      })as OrderItem));

      return { message: 'Order placed successfully', order };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create order: ${error.message}`);
    }
  }

  async findUserOrders(userId: number): Promise<Order[]> {
    return await this.orderModel.findAll({ where: { userId }, include: [OrderItem] });
  }

  async findAll(): Promise<Order[]> {
    return await this.orderModel.findAll({ include: [OrderItem] });
  }

  async findOne(orderId: number, currentUser: User): Promise<Order> {
    const order = await this.orderModel.findByPk(orderId, { include: [OrderItem] });
    if (!order) throw new NotFoundException('Order not found');

    if (order.userId !== currentUser.id && !currentUser.roles.includes(Roles.ADMIN)) {
      throw new ForbiddenException('You are not allowed to view this order');
    }

    return order;
  }

  async findOrderItems(orderId: number, user: User): Promise<OrderItem[]> {
    const order = await this.findOne(orderId, user);
    return order.items;
  }

  async update(orderId: number, updateOrderDto: UpdateOrderDto, currentUser: User)
  : Promise<{ message: string; order: Order }> {
    const order = await this.findOne(orderId, currentUser);

    if (order.status !== 'pending') {
      throw new ConflictException('Only pending orders can be updated');
    }

    await order.update(updateOrderDto);
    await order.save();
    return { message: 'Order updated successfully', order };
  }

  async updateOrderItem(orderId: number, itemId: number, updateOrderItemDto: UpdateOrderItemDto, currentUser: User)
  : Promise<{ message: string; orderItem: OrderItem; newTotalPrice: number }> {
    const order = await this.findOne(orderId, currentUser);
    const orderItem = await OrderItem.findOne({ where: { id: itemId, orderId } });

    if (!orderItem) throw new NotFoundException('Order item not found');

    if (order.status !== 'pending') {
      throw new ConflictException('Cannot update items of a non-pending order');
    }

    await orderItem.update({ quantity: updateOrderItemDto.quantity });

    const updatedOrderItems = await OrderItem.findAll({ where: { orderId } });
    const newTotalPrice = updatedOrderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    await order.update({ totalPrice: newTotalPrice });
    await order.save();

    return { message: 'Order item updated successfully', orderItem, newTotalPrice };
  }

  async cancel(orderId: number, currentUser: User): Promise<{ message: string; order: Order }> {
    const order = await this.findOne(orderId, currentUser);

    if (order.status !== 'pending') {
      throw new ConflictException('Only pending orders can be cancelled');
    }

    await order.update({ status: 'cancelled' });
    return { message: 'Order cancelled successfully', order };
  }

  async delete(orderId: number, currentUser: User): Promise<{ message: string }> {
    const order = await this.findOne(orderId, currentUser);

    if (order.status !== 'cancelled') {
      throw new ConflictException('Only cancelled orders can be deleted');
    }

    await OrderItem.destroy({ where: { orderId } });
    await order.destroy();
    return { message: 'Order deleted successfully' };
  }

  async updateStatus(orderId: number, status: string,updateOrderDto: UpdateOrderDto): 
  Promise<{ message: string; order: Order }> {
    const order = await this.orderModel.findByPk(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new ConflictException('Invalid status');
    }

    await order.update({ status });
    await order.save();
    return { message: `Order status updated to ${status}`, order };
  }
}
