import { Module } from '@nestjs/common';
import { PengajuanController } from './pengajuan.controller';
import { PengajuanService } from './pengajuan.service';
import { PengajuanSubmissionService } from './services/pengajuan-submission.service';
import { PengajuanQueryService } from './services/pengajuan-query.service';
import { PengajuanLaporanService } from './services/pengajuan-laporan.service';
import { PengajuanRevisionService } from './services/pengajuan-revision.service';
import { PengajuanAssertionService } from './services/pengajuan-assertion.service';
import { PengajuanNotifierService } from './services/pengajuan-notifier.service';
import { PengajuanTimelineService } from './services/pengajuan-timeline.service';

@Module({
  controllers: [PengajuanController],
  providers: [
    PengajuanService,
    PengajuanSubmissionService,
    PengajuanQueryService,
    PengajuanLaporanService,
    PengajuanRevisionService,
    PengajuanAssertionService,
    PengajuanNotifierService,
    PengajuanTimelineService,
  ],
  exports: [PengajuanService],
})
export class PengajuanModule {}
