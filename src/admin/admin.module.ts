import { Module } from '@nestjs/common';
import { AdminPengajuanController } from './pengajuan/admin-pengajuan.controller';
import { AdminPengajuanService } from './pengajuan/admin-pengajuan.service';
import { AdminFasilitasiController } from './fasilitasi/admin-fasilitasi.controller';
import { AdminFasilitasiService } from './fasilitasi/admin-fasilitasi.service';
import { AdminAccountController } from './pengaturan-akun/admin-account.controller';
import { AdminAccountService } from './pengaturan-akun/admin-account.service';
import { AdminPengajuanAssertionService } from './pengajuan/services/admin-pengajuan-assertion.service';
import { AdminPengajuanNotifierService } from './pengajuan/services/admin-pengajuan-notifier.service';
import { AdminPengajuanQueryService } from './pengajuan/services/admin-pengajuan-query.service';
import { AdminPengajuanTimelineService } from './pengajuan/services/admin-pengajuan-timeline.service';
import { AdminPengajuanPemeriksaanService } from './pengajuan/services/admin-pengajuan-pemeriksaan.service';
import { AdminPengajuanSurveyService } from './pengajuan/services/admin-pengajuan-survey.service';
import { AdminPengajuanSuratService } from './pengajuan/services/admin-pengajuan-surat.service';
import { AdminPengajuanLaporanService } from './pengajuan/services/admin-pengajuan-laporan.service';
import { AdminPengajuanPencairanService } from './pengajuan/services/admin-pengajuan-pencairan.service';
import { AdminPengajuanPengirimanService } from './pengajuan/services/admin-pengajuan-pengiriman.service';

@Module({
  controllers: [
    AdminPengajuanController,
    AdminFasilitasiController,
    AdminAccountController,
  ],
  providers: [
    AdminPengajuanService,
    AdminPengajuanQueryService,
    AdminPengajuanAssertionService,
    AdminPengajuanNotifierService,
    AdminPengajuanTimelineService,
    AdminPengajuanPemeriksaanService,
    AdminPengajuanSurveyService,
    AdminPengajuanSuratService,
    AdminPengajuanLaporanService,
    AdminPengajuanPencairanService,
    AdminPengajuanPengirimanService,
    AdminFasilitasiService,
    AdminAccountService,
  ],
})
export class AdminModule {}
