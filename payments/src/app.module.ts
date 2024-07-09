import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentsModule } from './payments/payments.module';
import { PaymentsService } from './payments/payments.service';
import { KafkaService } from './queue/kafka.service';

@Module({
  imports: [PaymentsModule],
  controllers: [AppController],
  providers: [AppService, KafkaService, PaymentsService],
})

export class AppModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly paymentsService: PaymentsService) { }

  async onModuleInit() {
    await this.paymentsService.consumeMessages();
  }

  async onModuleDestroy() {
    await this.paymentsService.closeConsumer();
  }
}
