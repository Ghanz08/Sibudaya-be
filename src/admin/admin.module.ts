import { Module } from '@nestjs/common';
import { AdminPengajuanController } from './pengajuan/admin-pengajuan.controller';
import { AdminPengajuanService } from './pengajuan/admin-pengajuan.service';

@Module({
  controllers: [AdminPengajuanController],
  providers: [AdminPengajuanService],
})
export class AdminModule {}
