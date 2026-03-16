import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotifikasiService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveUserDisplayName(userId: string): Promise<string | null> {
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
      select: {
        first_name: true,
        last_name: true,
        email: true,
      },
    });

    if (!user) return null;

    const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
    if (fullName) return fullName;
    return user.email;
  }

  async kirim(userId: string, judul: string, pesan: string) {
    return this.prisma.notifikasi.create({
      data: { user_id: userId, judul, pesan },
    });
  }

  async kirimKeAdmin(judul: string, pesan: string, dariUserId?: string) {
    const namaPengirim = dariUserId
      ? await this.resolveUserDisplayName(dariUserId)
      : null;
    const pesanFinal = namaPengirim
      ? `${pesan} (Dari: ${namaPengirim})`
      : pesan;

    const admins = await this.prisma.users.findMany({
      where: { role: 'ADMIN' },
      select: { user_id: true },
    });
    if (admins.length === 0) return;
    await this.prisma.notifikasi.createMany({
      data: admins.map((a) => ({
        user_id: a.user_id,
        judul,
        pesan: pesanFinal,
      })),
    });
  }

  async kirimKeSuperAdmin(judul: string, pesan: string) {
    const superAdmins = await this.prisma.users.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: { user_id: true },
    });
    if (superAdmins.length === 0) return;
    await this.prisma.notifikasi.createMany({
      data: superAdmins.map((a) => ({ user_id: a.user_id, judul, pesan })),
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
