import { 
  Injectable, NotFoundException, ForbiddenException, ConflictException, InternalServerErrorException, 
  BadRequestException
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
import { CurrentUser } from 'src/utility/common/decorators/current-user.decorator';
import { Cart } from 'src/carts/models/cart.model';


@Injectable()
export class OrdersService {
 
  constructor(
    @InjectModel(Order) private readonly orderModel: typeof Order,
    @InjectModel(OrderItem) private readonly orderItemModel: typeof OrderItem,
    @InjectModel(Cart) private readonly cartModel: typeof Cart,
    @InjectModel(Product) private readonly productModel: typeof Product,
    ) {}

  // async create(createOrderDto: CreateOrderDto, currentUser: User)
  // : Promise<{ message: string; order: Order }> {
  // try {
  //   let totalPrice = 0;

  //   const products = await Product.findAll({
  //     where: { id: createOrderDto.items.map(item => item.productId) }
  //   });

  //   if (products.length !== createOrderDto.items.length) {
  //     throw new NotFoundException('One or more products were not found');
  //   }

  //   // prepare data of products inside the order and calculate the total price
  //   const items = createOrderDto.items.map((item) => {
  //     const product = products.find(p => p.id === item.productId);
  //     if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

  //     if (product.stock < item.quantity) {
  //       throw new BadRequestException(`Product ${product.name} is out of stock`);
  //     }

  //     totalPrice += product.price * item.quantity;
  //     return { productId: item.productId, quantity: item.quantity, price: product.price };
  //   });

  //   const order = await this.orderModel.create({
  //     userId: currentUser.id,
  //     status: 'pending',
  //     totalPrice
  //   }as Order);

  //   await OrderItem.bulkCreate(items.map(item => ({
  //     orderId: order.id,
  //     productId: item.productId,
  //     quantity: item.quantity,
  //     price: item.price
  //   })) as OrderItem[]);

  //   await Promise.all(
  //     products.map(product => {
  //       const orderedItem = items.find(item => item.productId === product.id);
  //       // update the stock of the product
  //       if (orderedItem) {
  //         return product.update({ stock: product.stock - orderedItem.quantity });
  //       }
  //     })
  //   );

  //   return { message: 'Order placed successfully', order };
  // } catch (error) {
  //   throw new InternalServerErrorException(`Failed to create order: ${error.message}`);
  // }
// }

async createOrderFromCart(userId: number,@CurrentUser() currentUser: User): 
Promise <{ message: string; order: Order }> {
  try {
    const cartItems = await this.cartModel.findAll({
      where: { userId },
      include: [{ model: Product }],
    });

    if (cartItems.length === 0) {
      throw new NotFoundException('Your cart is empty');
    }

    const totalPrice = cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

    const order = await this.orderModel.create({
      userId,
      totalPrice,
      status: 'pending', 
    } as Order);

    for (const cartItem of cartItems) {
      await this.orderItemModel.create({
        orderId: order.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        price: cartItem.product.price,
      } as OrderItem);

      cartItem.product.stock -= cartItem.quantity;
      await cartItem.product.save();
    }

    await this.cartModel.destroy({ where: { userId } });

    return { message: 'Order placed successfully', order };
  } catch (error) {
    throw new InternalServerErrorException(`Error creating order: ${error.message}`);
  }

}
  async findUserOrders(@CurrentUser() currentUser: User): Promise<Order[]> {
    try {
      const orders = await this.orderModel.findAll({ where: { userId: currentUser.id }, 
        include: [OrderItem]
       });
       if (orders.length === 0) {
        throw new NotFoundException('No orders found for this user');
      }
      return orders;
    }catch (error) {
      throw new InternalServerErrorException(`Failed to find user orders: ${error.message}`);
    }
  }

  async findAll(@CurrentUser() currentUser: User): Promise<Order[]> {
    try {
      const orders = await this.orderModel.findAll({ include: [OrderItem] });
      if(!currentUser.roles.includes(Roles.ADMIN) )
        throw new ForbiddenException('You are not allowed to view all orders');
      if (orders.length === 0) {
        throw new NotFoundException('No orders found');
      }
      return orders;
    }catch (error) {
      throw new InternalServerErrorException(`Failed to find all orders: ${error.message}`);
    }
  }

  async findOne(orderId: number, currentUser: User): Promise<Order> {
    try {

    const order = await this.orderModel.findByPk(orderId, { include: [OrderItem] });
    if (!order) throw new NotFoundException('Order not found');
    return order;

  }catch (error) {
    throw new InternalServerErrorException(`Failed to find order: ${error.message}`);
  }
  }

  async findOrderItems(orderId: number, @CurrentUser() currentUser: User): Promise<OrderItem[]> {
    try {
      const order = await this.findOne(orderId, currentUser);
      if (!order) throw new NotFoundException('Order not found');
      return order.items;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to find order items: ${error.message}`);
    }
  }

  async update(orderId: number, updateOrderDto: UpdateOrderDto, currentUser: User)

  : Promise<{ message: string; order: Order }> {
    try {
    const order = await this.findOne(orderId, currentUser);

    if (order.status !== 'pending') {
      throw new ConflictException('Only pending orders can be updated');
    }
     const [affectedRows] = await this.orderModel.update(updateOrderDto, {
       where: { id: orderId } 
      });
      if(affectedRows === 0) {
        throw new BadRequestException('No changes detected, order was not updated');
      }

    await order.update(updateOrderDto);
    await order.save();
    return { message: 'Order updated successfully', order };
  } catch (error) {
    throw new InternalServerErrorException(`Failed to update order: ${error.message}`);
  }
  }

  async updateOrderItem(orderId: number, itemId: number, updateOrderItemDto: UpdateOrderItemDto, currentUser: User)
  : Promise<{ message: string; orderItem: OrderItem; newTotalPrice: number }> {
    try {

    const order = await this.findOne(orderId, currentUser);
    const orderItem = await OrderItem.findOne({ where: { id: itemId, orderId } });

    if (!orderItem) throw new NotFoundException('Order item not found');

    if (order.status !== 'pending') {
      throw new ConflictException('Cannot update items of a non-pending order');
    }

    if (updateOrderItemDto.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const [affectedRows] = await OrderItem.update(updateOrderItemDto, {
      where: { id: itemId } 
    })

    if (affectedRows === 0) {
      throw new BadRequestException('No changes detected, order item was not updated');
    }

    await orderItem.update({ quantity: updateOrderItemDto.quantity });

    const updatedOrderItems = await OrderItem.findAll({ where: { orderId } });
    const newTotalPrice = updatedOrderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    await order.update({ totalPrice: newTotalPrice });
    await order.save();

    return { message: 'Order item updated successfully', orderItem, newTotalPrice };
  } catch (error) {
    throw new InternalServerErrorException(`Failed to update order item: ${error.message}`);
  }
  }

  async cancel(orderId: number, currentUser: User): Promise<{ message: string; order: Order }> {
    try {
    const order = await this.findOne(orderId, currentUser);

    if (order.status !== 'pending') {
      throw new ConflictException('Only pending orders can be cancelled');
    }

    await order.update({ status: 'cancelled' });
    return { message: 'Order cancelled successfully', order };
  } catch (error) {
    throw new InternalServerErrorException(`Failed to cancel order: ${error.message}`);
  }
  }

  async delete(orderId: number, currentUser: User): Promise<{ message: string }> {
    try {
    const order = await this.findOne(orderId, currentUser);

    if (order.status !== 'cancelled') {
      throw new ConflictException('Only cancelled orders can be deleted');
    }

    await OrderItem.destroy({ where: { orderId } });
    await order.destroy();
    return { message: 'Order deleted successfully' };
  } catch (error) {
    throw new InternalServerErrorException(`Failed to delete order: ${error.message}`);
  }
  }

  async updateOrderStatus(orderId: number, status: string) : Promise<Order> {
    try {
    const order = await this.orderModel.findByPk(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      throw new ConflictException(`Invalid order status: ${status}`);
    }

    order.status = status;
    return await order.save();
  } catch (error) {
    throw new InternalServerErrorException(`Failed to update order status: ${error.message}`);  
  }
  }
}
