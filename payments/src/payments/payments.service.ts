import { Injectable, Logger } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { KafkaService } from 'src/queue/kafka.service';
import * as protobuf from 'protobufjs'; // Importa o protobufjs

@Injectable()
export class PaymentsService {
  private consumer;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly kafkaService: KafkaService) {
    this.consumer = this.kafkaService.getConsumer('payments-consumer-group');
  }

  async processPayment(): Promise<boolean> {
    // Simulação simples de processamento de pagamento
    return Math.random() < 0.8; // 80% de chance de sucesso
  }

  async consumeMessages(): Promise<void> {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: 'payments_topic' });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const payment = this.decodePaymentMessage(message.value);
          if (payment) {
            this.logger.debug(`Processando pagamento para pedido ${payment.orderId}...`);
            // Simulação de processamento de pagamento
            const paymentSuccess = await this.processPayment();

            if (paymentSuccess) {
              await this.sendPaymentSuccess(message);
            } else {
              await this.sendPaymentFailure(message);
            }
          }
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao consumir mensagens do Kafka: ${error.message}`);
    }
  }

  async sendPaymentSuccess(order: any): Promise<void> {
    const producer = this.kafkaService.getProducer();
    try {
      await producer.connect();
      await producer.send({
        topic: 'payments_success_topic',
        messages: [{ value: await this.serialize({ orderId: order.orderId, status: 'success' }) }],
      });
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem de pagamento bem-sucedido: ${error.message}`);
    } finally {
      await producer.disconnect();
    }
  }

  async serialize(message: any) {
    try {
      // Caminho para o arquivo .proto
      const paymentProtoPath = 'src/protobuf/payment.proto';

      // Carrega as definições protobuf
      const root = await protobuf.load(paymentProtoPath);

      // Obtém a mensagem Payment do arquivo protobuf
      const Payment = root.lookupType('Payment');

      // Cria uma mensagem Payment
      const paymentMessage = Payment.create(message);

      // Serializa a mensagem para um buffer (Uint8Array)
      const buffer = Payment.encode(paymentMessage).finish();

      return Buffer.from(buffer);
    } catch (error) {
      throw new Error(`Erro ao serializar mensagem: ${error}`);
    }
  }

  async sendPaymentFailure(order: any): Promise<void> {
    const producer = this.kafkaService.getProducer();
    try {
      await producer.connect();
      await producer.send({
        topic: 'payments_failure_topic',
        messages: [{ value: await this.serialize({ orderId: order.orderId, status: 'failure' }) }],
      });
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem de pagamento com falha: ${error.message}`);
    } finally {
      await producer.disconnect();
    }
  }

  decodePaymentMessage(messageValue: Buffer): any | null {
    try {
      // Caminho para o arquivo JavaScript gerado pelo pbjs
      const paymentProtoPath = 'src/protobuf/payment.ts';

      // Carrega as definições protobuf
      const root = protobuf.loadSync(paymentProtoPath);

      // Obtém a mensagem Payment do arquivo protobuf
      const Payment = root.lookupType('payment.Payment');

      // Decodifica a mensagem a partir do Buffer recebido
      const paymentMessage = Payment.decode(messageValue);

      // Converte a mensagem decodificada para um objeto JavaScript plano
      const paymentObject = Payment.toObject(paymentMessage, {
        longs: String,
        enums: String,
        bytes: String,
      });

      return paymentObject;
    } catch (error) {
      this.logger.error(`Erro ao decodificar mensagem de pagamento: ${error.message}`);
      return null;
    }
  }

  async closeConsumer() {
    await this.consumer.disconnect();
  }

  create(createPaymentDto: CreatePaymentDto) {
    return 'This action adds a new payment';
  }

  findAll() {
    return `This action returns all payments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} payment`;
  }

  update(id: number, updatePaymentDto: UpdatePaymentDto) {
    return `This action updates a #${id} payment`;
  }

  remove(id: number) {
    return `This action removes a #${id} payment`;
  }
}
