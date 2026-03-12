import { Module } from '@nestjs/common';
import { FasilitasiController } from './fasilitasi.controller';
import { FasilitasiService } from './fasilitasi.service';

@Module({
  controllers: [FasilitasiController],
  providers: [FasilitasiService],
  exports: [FasilitasiService],
})
export class FasilitasiModule {}
