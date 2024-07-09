import { Injectable } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class KafkaService {
    private kafka: Kafka;

    constructor() {
        this.kafka = new Kafka({
            clientId: 'payment-processing-client',
            brokers: ['localhost:9092'], // Endereço do Broker Kafka
        });
    }

    getProducer() {
        return this.kafka.producer();
    }

    getConsumer(groupId: string) {
        return this.kafka.consumer({ groupId });
    }
}