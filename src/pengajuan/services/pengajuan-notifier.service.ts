import { Injectable } from '@nestjs/common';
import { NotifikasiService } from '../../notifikasi/notifikasi.service';

@Injectable()
export class PengajuanNotifierService {
  constructor(private readonly notifikasiService: NotifikasiService) {}

  async kirimKeAdminDanSuperAdmin(
    judul: string,
    pesan: string,
    userId: string,
  ) {
    await this.notifikasiService.kirimKeAdminDanSuperAdmin(
      judul,
      pesan,
      userId,
    );
  }
}
