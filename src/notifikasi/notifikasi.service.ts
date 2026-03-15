import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotifikasiService {
  constructor(private readonly prisma: PrismaService) {}

  async kirim(userId: string, judul: string, pesan: string) {
    return this.prisma.notifikasi.create({
      data: { user_id: userId, judul, pesan },
    });
  }

  async kirimKeAdmin(judul: string, pesan: string) {
    const admins = await this.prisma.users.findMany({
      where: { role: 'ADMIN' },
      select: { user_id: true },
    });
    if (admins.length === 0) return;
    await this.prisma.notifikasi.createMany({
      data: admins.map((a) => ({ user_id: a.user_id, judul, pesan })),
    });
  }

  async findByUser(userId: string) {
    const data = await this.prisma.notifikasi.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    if (data.length === 0) {
      return { message: 'Tidak ada notifikasi tersedia', data: [] };
    }

    return { total: data.length, data };
  }

  async bacaNotifikasi(notifikasiId: string, userId: string) {
    return this.prisma.notifikasi.updateMany({
      where: { notifikasi_id: notifikasiId, user_id: userId },
      data: { status_baca: true },
    });
  }

  async bacaSemua(userId: string) {
    return this.prisma.notifikasi.updateMany({
      where: { user_id: userId, status_baca: false },
      data: { status_baca: true },
    });
  }
}
