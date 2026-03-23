import { Injectable } from '@nestjs/common';
import { AdminPengajuanQueryService } from './services/admin-pengajuan-query.service';
import { AdminPengajuanPemeriksaanService } from './services/admin-pengajuan-pemeriksaan.service';
import { AdminPengajuanSurveyService } from './services/admin-pengajuan-survey.service';
import { AdminPengajuanSuratService } from './services/admin-pengajuan-surat.service';
import { AdminPengajuanLaporanService } from './services/admin-pengajuan-laporan.service';
import { AdminPengajuanPencairanService } from './services/admin-pengajuan-pencairan.service';
import { AdminPengajuanPengirimanService } from './services/admin-pengajuan-pengiriman.service';
import { AdminPengajuanTimelineService } from './services/admin-pengajuan-timeline.service';
import {
  FilterPengajuanDto,
  SetSurveyDto,
  SetujuiPemeriksaanDto,
  TolakSurveyDto,
  TolakLaporanDto,
  TolakPemeriksaanDto,
  UpdateTimelineStatusDto,
  UploadBuktiPencairanDto,
  UploadBuktiPengirimanDto,
  UploadSuratPersetujuanDto,
} from './dto/admin-pengajuan.dto';

/**
 * Facade service for AdminPengajuan workflow operations.
 * Delegates to specialized workflow services: pemeriksaan, survey, surat, laporan,
 * pencairan (pentas), pengiriman (hibah), and timeline.
 */
@Injectable()
export class AdminPengajuanService {
  constructor(
    private readonly queryService: AdminPengajuanQueryService,
    private readonly pemeriksaanService: AdminPengajuanPemeriksaanService,
    private readonly surveyService: AdminPengajuanSurveyService,
    private readonly suratService: AdminPengajuanSuratService,
    private readonly laporanService: AdminPengajuanLaporanService,
    private readonly pencairanService: AdminPengajuanPencairanService,
    private readonly pengirimanService: AdminPengajuanPengirimanService,
    private readonly timelineService: AdminPengajuanTimelineService,
  ) {}

  // ── List & Detail ─────────────────────────────────────────────────────────

  async getDashboard(filter: FilterPengajuanDto) {
    return this.queryService.getDashboard(filter);
  }

  findAll(filter: FilterPengajuanDto) {
    return this.queryService.findAll(filter);
  }

  async findDetail(pengajuanId: string) {
    return this.queryService.findDetail(pengajuanId);
  }

  // ── Step 2: Pemeriksaan ───────────────────────────────────────────────────

  async setujuiPemeriksaan(pengajuanId: string, dto: SetujuiPemeriksaanDto) {
    return this.pemeriksaanService.setujui(pengajuanId, dto);
  }

  async tolakPemeriksaan(
    pengajuanId: string,
    dto: TolakPemeriksaanDto,
    suratFile?: Express.Multer.File,
  ) {
    return this.pemeriksaanService.tolak(pengajuanId, dto, suratFile);
  }

  // ── Step 3 Hibah: Survey Lapangan ─────────────────────────────────────────

  async setSurvey(pengajuanId: string, dto: SetSurveyDto) {
    return this.surveyService.set(pengajuanId, dto);
  }

  async selesaikanSurvey(pengajuanId: string) {
    return this.surveyService.selesai(pengajuanId);
  }

  async tolakSurvey(pengajuanId: string, dto: TolakSurveyDto) {
    return this.surveyService.tolak(pengajuanId, dto);
  }

  // ── Step: Surat Persetujuan (upload) ─────────────────────────────────────

  async uploadSuratPersetujuan(
    pengajuanId: string,
    dto: UploadSuratPersetujuanDto,
    file: Express.Multer.File,
  ) {
    return this.suratService.upload(pengajuanId, dto, file);
  }

  async konfirmasiSuratPersetujuan(pengajuanId: string) {
    return this.suratService.konfirmasi(pengajuanId);
  }

  // ── Step: Laporan Kegiatan (admin actions) ────────────────────────────────

  async setujuiLaporan(pengajuanId: string) {
    return this.laporanService.setujui(pengajuanId);
  }

  async tolakLaporan(pengajuanId: string, dto: TolakLaporanDto) {
    return this.laporanService.tolak(pengajuanId, dto);
  }

  // ── Step Pentas: Pencairan Dana ───────────────────────────────────────────

  async uploadBuktiPencairan(
    pengajuanId: string,
    dto: UploadBuktiPencairanDto,
    file: Express.Multer.File,
  ) {
    return this.pencairanService.uploadBukti(pengajuanId, dto, file);
  }

  async selesaikanPencairan(pengajuanId: string) {
    return this.pencairanService.selesai(pengajuanId);
  }

  // ── Step Hibah: Pengiriman Sarana ─────────────────────────────────────────

  async uploadBuktiPengiriman(
    pengajuanId: string,
    dto: UploadBuktiPengirimanDto,
    file: Express.Multer.File,
  ) {
    return this.pengirimanService.uploadBukti(pengajuanId, dto, file);
  }

  // ── Flexible Timeline Status (admin override) ────────────────────────────

  async updateTimelineStatus(
    pengajuanId: string,
    dto: UpdateTimelineStatusDto,
  ) {
    return this.timelineService.updateTimelineStatus(pengajuanId, dto);
  }
}
