import { Injectable } from '@nestjs/common';
import { STATUS } from '../../common/constants/status.constants';
import {
  PengajuanTimelineResponse,
  TimelineStep,
  TimelineStatus,
} from '../dto/pengajuan-timeline.dto';

@Injectable()
export class PengajuanTimelineService {
  private normalizeStepStatus(status?: string | null): TimelineStatus {
    if (status === STATUS.DITOLAK) return STATUS.DITOLAK;
    if (status === STATUS.SELESAI || status === STATUS.DISETUJUI) {
      return STATUS.SELESAI;
    }
    return STATUS.DALAM_PROSES;
  }

  buildTimeline(data: any): PengajuanTimelineResponse {
    const isPentas = data.jenis_fasilitasi_id === 1;
    const pemeriksaanStatus = this.normalizeStepStatus(data.status_pemeriksaan);
    const pemeriksaanRejected = pemeriksaanStatus === STATUS.DITOLAK;

    const surveyStatus = data.survey_lapangan
      ? this.normalizeStepStatus(data.survey_lapangan.status)
      : STATUS.BELUM_TERSEDIA;
    const surveyRejected = surveyStatus === STATUS.DITOLAK;

    const suratPrereq = isPentas
      ? pemeriksaanStatus === STATUS.SELESAI
      : surveyStatus === STATUS.SELESAI;
    const suratStatus: TimelineStatus = suratPrereq
      ? data.surat_persetujuan
        ? this.normalizeStepStatus(data.surat_persetujuan.status)
        : STATUS.DALAM_PROSES
      : STATUS.BELUM_TERSEDIA;

    const pengirimanStatus: TimelineStatus = !isPentas
      ? suratStatus === STATUS.SELESAI
        ? data.pengiriman_sarana
          ? this.normalizeStepStatus(data.pengiriman_sarana.status)
          : STATUS.DALAM_PROSES
        : STATUS.BELUM_TERSEDIA
      : STATUS.BELUM_TERSEDIA;

    const pencairanStatus: TimelineStatus = isPentas
      ? data.laporan_kegiatan?.status === STATUS.DISETUJUI
        ? data.pencairan_dana
          ? this.normalizeStepStatus(data.pencairan_dana.status)
          : STATUS.DALAM_PROSES
        : STATUS.BELUM_TERSEDIA
      : STATUS.BELUM_TERSEDIA;

    const laporanPrereq = isPentas
      ? suratStatus === STATUS.SELESAI
      : pengirimanStatus === STATUS.SELESAI;
    const laporanStatus: TimelineStatus = laporanPrereq
      ? data.laporan_kegiatan
        ? this.normalizeStepStatus(data.laporan_kegiatan.status)
        : STATUS.DALAM_PROSES
      : STATUS.BELUM_TERSEDIA;

    const terminalAtSurvey = !isPentas && surveyRejected;
    const forceBelumTersedia = (status: TimelineStatus): TimelineStatus => {
      if (terminalAtSurvey && status !== STATUS.DITOLAK) {
        return STATUS.BELUM_TERSEDIA;
      }
      return status;
    };

    const steps: TimelineStep[] = [
      {
        code: 'PENDAFTARAN',
        title: 'Pengajuan Data Pendaftaran',
        status: STATUS.SELESAI,
      },
      {
        code: 'PEMERIKSAAN',
        title: 'Pemeriksaan Data oleh Admin dan Penetapan Paket Fasilitas',
        status: pemeriksaanStatus,
        actions: pemeriksaanRejected
          ? {
              can_batalkan_pengajuan: true,
              can_perbarui_pengajuan: true,
            }
          : undefined,
      },
    ];

    if (!isPentas) {
      steps.push({
        code: 'SURVEY',
        title: 'Survey Lapangan oleh Pihak Dinas Kebudayaan',
        status: forceBelumTersedia(
          pemeriksaanRejected ? STATUS.BELUM_TERSEDIA : surveyStatus,
        ),
        is_terminal: surveyRejected,
      });
    }

    steps.push({
      code: 'SURAT_PERSETUJUAN',
      title: 'Pengisian dan Penandatanganan Surat Persetujuan',
      status: forceBelumTersedia(
        pemeriksaanRejected ? STATUS.BELUM_TERSEDIA : suratStatus,
      ),
    });

    if (isPentas) {
      steps.push({
        code: 'PELAPORAN',
        title: 'Pelaporan Kegiatan',
        status: forceBelumTersedia(
          pemeriksaanRejected ? STATUS.BELUM_TERSEDIA : laporanStatus,
        ),
        actions:
          laporanStatus === STATUS.DITOLAK
            ? { can_unggah_ulang_laporan: true }
            : undefined,
      });
      steps.push({
        code: 'PENCAIRAN',
        title: 'Pencairan Dana',
        status: forceBelumTersedia(
          pemeriksaanRejected ? STATUS.BELUM_TERSEDIA : pencairanStatus,
        ),
      });
    } else {
      steps.push({
        code: 'PENGIRIMAN',
        title: 'Pengiriman Sarana Prasarana',
        status: forceBelumTersedia(
          pemeriksaanRejected ? STATUS.BELUM_TERSEDIA : pengirimanStatus,
        ),
      });
      steps.push({
        code: 'PELAPORAN',
        title: 'Pelaporan Kegiatan',
        status: forceBelumTersedia(
          pemeriksaanRejected ? STATUS.BELUM_TERSEDIA : laporanStatus,
        ),
        actions:
          laporanStatus === STATUS.DITOLAK
            ? { can_unggah_ulang_laporan: true }
            : undefined,
      });
    }

    return {
      status_global: data.status,
      jenis_fasilitasi_id: data.jenis_fasilitasi_id,
      steps,
    };
  }
}
