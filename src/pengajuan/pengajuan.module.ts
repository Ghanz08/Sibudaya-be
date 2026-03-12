import { Module } from '@nestjs/common';
import { PengajuanController } from './pengajuan.controller';
import { PengajuanService } from './pengajuan.service';

@Module({
  controllers: [PengajuanController],
  providers: [PengajuanService],
  exports: [PengajuanService],
})
export class PengajuanModule {}
