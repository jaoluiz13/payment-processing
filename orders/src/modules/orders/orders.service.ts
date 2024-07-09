import { Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { KafkaService } from 'src/queue/kafka.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private consumer;

  constructor(private readonly kafkaService: KafkaService) {
    this.consumer = this.kafkaService.getConsumer('orders-consumer-group');
  }
  async create(createOrderDto: CreateOrderDto) {
    //! Cria ordem
    let createdOrder = {};
    //! envia para processar pagamento
    await this.kafkaService.sendPaymentMessage(createdOrder);

    return {

    };
  }

  async consumePaymentResponses(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'payments_success_topic' });
    await this.consumer.subscribe({ topic: 'payments_failure_topic' });
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const response = JSON.parse(message.value.toString());
        const orderId = response.orderId;
        const status = response.status;

        if (status === 'success') {
          this.logger.log(`Pagamento para pedido ${orderId} foi processado com sucesso.`);
          // Atualizar status do pedido para "Pago"
          // Lógica de atualização do pedido
        } else if (status === 'failure') {
          this.logger.error(`Falha no pagamento para pedido ${orderId}.`);
          // Lidar com a falha do pagamento
          // Por exemplo, reprocessar o pagamento ou notificar o usuário
        }
      },
    });
  }

  async closeConsumer() {
    await this.consumer.disconnect();
  }

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
