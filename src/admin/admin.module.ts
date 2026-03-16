import { Module } from '@nestjs/common';
import { AdminPengajuanController } from './pengajuan/admin-pengajuan.controller';
import { AdminPengajuanService } from './pengajuan/admin-pengajuan.service';
import { AdminFasilitasiController } from './fasilitasi/admin-fasilitasi.controller';
import { AdminFasilitasiService } from './fasilitasi/admin-fasilitasi.service';
import { AdminAccountController } from './pengaturan-akun/admin-account.controller';
import { AdminAccountService } from './pengaturan-akun/admin-account.service';

@Module({
  controllers: [
    AdminPengajuanController,
    AdminFasilitasiController,
    AdminAccountController,
  ],
  providers: [
    AdminPengajuanService,
    AdminFasilitasiService,
    AdminAccountService,
  ],
})
export class AdminModule {}
