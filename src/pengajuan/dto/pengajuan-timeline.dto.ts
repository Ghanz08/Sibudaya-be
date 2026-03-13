import { STATUS } from '../../common/constants/status.constants';

export type TimelineStatus =
  | typeof STATUS.BELUM_TERSEDIA
  | typeof STATUS.DALAM_PROSES
  | typeof STATUS.SELESAI
  | typeof STATUS.DITOLAK;

export interface TimelineStepAction {
  can_batalkan_pengajuan?: boolean;
  can_perbarui_pengajuan?: boolean;
  can_unggah_ulang_laporan?: boolean;
}

export interface TimelineStep {
  code: string;
  title: string;
  status: TimelineStatus;
  actions?: TimelineStepAction;
  is_terminal?: boolean;
}

export interface PengajuanTimelineResponse {
  status_global: string;
  jenis_fasilitasi_id: number;
  steps: TimelineStep[];
}
