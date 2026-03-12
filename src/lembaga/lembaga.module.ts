import { Module } from '@nestjs/common';
import { LembagaController } from './lembaga.controller';
import { LembagaService } from './lembaga.service';

@Module({
  controllers: [LembagaController],
  providers: [LembagaService],
  exports: [LembagaService],
})
export class LembagaModule {}
