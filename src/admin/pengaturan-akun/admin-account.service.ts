import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAdminAccountDto,
  UpdateAdminAccountDto,
} from './dto/admin-account.dto';

@Injectable()
export class AdminAccountService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private readonly adminSelect = {
    user_id: true,
    first_name: true,
    last_name: true,
    email: true,
    no_telp: true,
    address: true,
    role: true,
    provider: true,
    created_at: true,
  } as const;

  findAllAdmins() {
    return this.prisma.users.findMany({
      where: { role: 'ADMIN' },
      select: this.adminSelect,
      orderBy: { created_at: 'desc' },
    });
  }

  async getAdminsSummary() {
    const [total_admin, local_admin, latest_admins] = await Promise.all([
      this.prisma.users.count({ where: { role: 'ADMIN' } }),
      this.prisma.users.count({ where: { role: 'ADMIN', provider: 'LOCAL' } }),
      this.prisma.users.findMany({
        where: { role: 'ADMIN' },
        select: this.adminSelect,
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
    ]);

    return {
      statistik: {
        total_admin,
        local_admin,
      },
      admin_terbaru: latest_admins.map((admin) => this.toAdminResponse(admin)),
    };
  }

  async findAdminById(userId: string) {
    const user = await this.findAdminOrThrow(userId);
    return this.toAdminResponse(user);
  }

  async createAdmin(dto: CreateAdminAccountDto) {
    if (dto.password !== dto.confirm_password) {
      throw new BadRequestException(
        'Password dan konfirmasi password tidak cocok',
      );
    }

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.users.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const password_hash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const created = await this.prisma.users.create({
      data: {
        first_name: dto.first_name.trim(),
        last_name: dto.last_name.trim(),
        email,
        no_telp: dto.no_telp.trim(),
        address: dto.address?.trim(),
        password_hash,
        role: 'ADMIN',
        provider: 'LOCAL',
      },
      select: this.adminSelect,
    });

    return this.toAdminResponse(created);
  }

  async updateAdmin(userId: string, dto: UpdateAdminAccountDto) {
    await this.findAdminOrThrow(userId);

    if (dto.password || dto.confirm_password) {
      if (!dto.password || !dto.confirm_password) {
        throw new BadRequestException(
          'Password dan konfirmasi password wajib diisi bersama',
        );
      }
      if (dto.password !== dto.confirm_password) {
        throw new BadRequestException(
          'Password dan konfirmasi password tidak cocok',
        );
      }
    }

    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const existing = await this.prisma.users.findUnique({ where: { email } });
      if (existing && existing.user_id !== userId) {
        throw new ConflictException('Email sudah terdaftar');
      }
    }

    const updated = await this.prisma.users.update({
      where: { user_id: userId },
      data: {
        ...(dto.first_name !== undefined && {
          first_name: dto.first_name.trim(),
        }),
        ...(dto.last_name !== undefined && {
          last_name: dto.last_name.trim(),
        }),
        ...(dto.email !== undefined && {
          email: dto.email.trim().toLowerCase(),
        }),
        ...(dto.no_telp !== undefined && {
          no_telp: dto.no_telp.trim(),
        }),
        ...(dto.address !== undefined && {
          address: dto.address?.trim(),
        }),
        ...(dto.password !== undefined && {
          password_hash: await bcrypt.hash(dto.password, this.SALT_ROUNDS),
        }),
      },
      select: this.adminSelect,
    });

    return this.toAdminResponse(updated);
  }

  async deleteAdmin(userId: string) {
    const user = await this.findAdminOrThrow(userId);

    await this.prisma.users.delete({ where: { user_id: userId } });

    return {
      message: `Akun admin ${user.email} berhasil dihapus`,
    };
  }

  async resetAdminPassword(userId: string) {
    await this.findAdminOrThrow(userId);

    const defaultPassword = this.configService
      .get<string>('ADMIN_DEFAULT_PASSWORD')
      ?.trim();

    if (!defaultPassword) {
      throw new BadRequestException(
        'Konfigurasi ADMIN_DEFAULT_PASSWORD belum diset',
      );
    }

    const password_hash = await bcrypt.hash(defaultPassword, this.SALT_ROUNDS);

    await this.prisma.users.update({
      where: { user_id: userId },
      data: { password_hash, provider: 'LOCAL' },
    });

    return { message: 'Password admin berhasil direset' };
  }

  private async findAdminOrThrow(userId: string) {
    const user = await this.prisma.users.findFirst({
      where: { user_id: userId, role: 'ADMIN' },
      select: this.adminSelect,
    });

    if (!user) {
      throw new NotFoundException('Akun admin tidak ditemukan');
    }

    return user;
  }

  private toAdminResponse(user: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    no_telp: string | null;
    address: string | null;
    role: string;
    provider: string;
    created_at: Date;
  }) {
    return {
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
      email: user.email,
      no_telp: user.no_telp,
      address: user.address,
      role: user.role,
      provider: user.provider,
      created_at: user.created_at,
    };
  }
}
