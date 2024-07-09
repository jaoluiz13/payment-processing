import { Injectable } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import * as protobuf from 'protobufjs';

@Injectable()
export class KafkaService {
    private kafka: Kafka;
    private producer: Producer;

    constructor() {
        this.kafka = new Kafka({
            clientId: 'payment-processing-client',
            brokers: ['localhost:9092']  // Endereço do Broker Kafka
        });

        this.producer = this.kafka.producer();
    }

    async sendPaymentMessage(order: any): Promise<void> {
        try {
            await this.producer.connect();
            let message = await this.producer.send({
                topic: 'payments_topic',
                messages: [{ value: await this.serialize(order) }]
            });

            console.log(`Mensagem enviada para o tópico payments_topic:`, message);
        } catch (error) {
            console.error('Erro ao enviar mensagem para o Kafka:', error);
        } finally {
            await this.producer.disconnect();
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

    getConsumer(groupId: string) {
        return this.kafka.consumer({ groupId });
    }
}