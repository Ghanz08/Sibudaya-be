import { Injectable } from '@nestjs/common';
import {
  CreatePengajuanHibahDto,
  CreatePengajuanPentasDto,
} from './dto/create-pengajuan.dto';
import {
  BatalkanPengajuanDto,
  UpdatePengajuanHibahDto,
  UpdatePengajuanPentasDto,
} from './dto/update-pengajuan.dto';
import { PengajuanSubmissionService } from './services/pengajuan-submission.service';
import { PengajuanQueryService } from './services/pengajuan-query.service';
import { PengajuanLaporanService } from './services/pengajuan-laporan.service';
import { PengajuanRevisionService } from './services/pengajuan-revision.service';

@Injectable()
export class PengajuanService {
  constructor(
    private readonly submissionService: PengajuanSubmissionService,
    private readonly queryService: PengajuanQueryService,
    private readonly laporanService: PengajuanLaporanService,
    private readonly revisionService: PengajuanRevisionService,
  ) {}

  // ── Submit Pentas ─────────────────────────────────────────────────────────

  async submitPentas(
    userId: string,
    dto: CreatePengajuanPentasDto,
    proposalFile: Express.Multer.File,
  ) {
    return this.submissionService.submitPentas(userId, dto, proposalFile);
  }

  // ── Submit Hibah ──────────────────────────────────────────────────────────

  async submitHibah(
    userId: string,
    dto: CreatePengajuanHibahDto,
    proposalFile: Express.Multer.File,
  ) {
    return this.submissionService.submitHibah(userId, dto, proposalFile);
  }

  // ── List pengajuan milik user ─────────────────────────────────────────────

  async findByUser(userId: string) {
    return this.queryService.findByUser(userId);
  }

  // ── Detail pengajuan (timeline) ───────────────────────────────────────────

  async findDetail(pengajuanId: string, userId: string) {
    return this.queryService.findDetail(pengajuanId, userId);
  }

  // ── Upload laporan kegiatan (user) ────────────────────────────────────────

  async uploadLaporan(
    pengajuanId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    return this.laporanService.uploadLaporan(pengajuanId, userId, file);
  }

  async revisiPentas(
    pengajuanId: string,
    userId: string,
    dto: UpdatePengajuanPentasDto,
    proposalFile?: Express.Multer.File,
  ) {
    return this.revisionService.revisiPentas(
      pengajuanId,
      userId,
      dto,
      proposalFile,
    );
  }

  async revisiHibah(
    pengajuanId: string,
    userId: string,
    dto: UpdatePengajuanHibahDto,
    proposalFile?: Express.Multer.File,
  ) {
    return this.revisionService.revisiHibah(
      pengajuanId,
      userId,
      dto,
      proposalFile,
    );
  }

  async batalkanPengajuan(
    pengajuanId: string,
    userId: string,
    dto: BatalkanPengajuanDto,
  ) {
    return this.revisionService.batalkanPengajuan(pengajuanId, userId, dto);
  }
}
