import { Injectable } from '@nestjs/common';
import { NotifikasiService } from '../../../notifikasi/notifikasi.service';

@Injectable()
export class AdminPengajuanNotifierService {
  constructor(private readonly notifikasiService: NotifikasiService) {}

  async kirimNotifikasiUserDanSuperAdmin(
    userId: string,
    judulUser: string,
    pesanUser: string,
  ) {
    return this.notifikasiService.kirim(userId, judulUser, pesanUser);
  }
}
