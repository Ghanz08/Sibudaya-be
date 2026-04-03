import { existsSync } from 'fs';
import { join, normalize } from 'path';
import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { SafeUser } from '../../auth/auth.service';
import { PrismaService } from '../../prisma/prisma.service';

type FileCategory =
  | 'proposal'
  | 'sertifikat'
  | 'surat'
  | 'laporan'
  | 'pencairan'
  | 'pengiriman'
  | 'penolakan'
  | 'template';

const FILE_CATEGORIES: FileCategory[] = [
  'proposal',
  'sertifikat',
  'surat',
  'laporan',
  'pencairan',
  'pengiriman',
  'penolakan',
  'template',
];

@Controller('files')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':category/:filename')
  async getFile(
    @Param('category') category: string,
    @Param('filename') filename: string,
    @CurrentUser() user: SafeUser,
    @Res() res: Response,
  ) {
    if (!FILE_CATEGORIES.includes(category as FileCategory)) {
      throw new NotFoundException('File tidak ditemukan');
    }

    if (filename.includes('/') || filename.includes('\\')) {
      throw new NotFoundException('File tidak ditemukan');
    }

    const hasAccess = await this.canAccessFile(
      category as FileCategory,
      filename,
      user,
    );

    if (!hasAccess) {
      throw new ForbiddenException('Tidak memiliki akses ke file ini');
    }

    const fullPath = normalize(join(process.cwd(), 'uploads', category, filename));
    if (!existsSync(fullPath)) {
      throw new NotFoundException('File tidak ditemukan');
    }

    return res.sendFile(fullPath);
  }

  private async canAccessFile(
    category: FileCategory,
    filename: string,
    user: SafeUser,
  ): Promise<boolean> {
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const suffix = `/${filename}`;

    if (category === 'template') {
      const count = await this.prisma.jenis_fasilitasi.count({
        where: {
          OR: [
            { template_proposal_file: { endsWith: suffix } },
            { template_laporan_file: { endsWith: suffix } },
          ],
        },
      });
      return count > 0;
    }

    if (isAdmin) {
      return this.existsInAnyRecord(category, suffix);
    }

    switch (category) {
      case 'proposal': {
        const count = await this.prisma.pengajuan.count({
          where: {
            proposal_file: { endsWith: suffix },
            lembaga_budaya: { user_id: user.user_id },
          },
        });
        return count > 0;
      }
      case 'sertifikat': {
        const count = await this.prisma.sertifikat_nik.count({
          where: {
            file_path: { endsWith: suffix },
            lembaga_budaya: { user_id: user.user_id },
          },
        });
        return count > 0;
      }
      case 'surat': {
        const count = await this.prisma.surat_persetujuan.count({
          where: {
            file_path: { endsWith: suffix },
            pengajuan: {
              lembaga_budaya: { user_id: user.user_id },
            },
          },
        });
        return count > 0;
      }
      case 'laporan': {
        const count = await this.prisma.laporan_kegiatan.count({
          where: {
            file_laporan: { endsWith: suffix },
            pengajuan: {
              lembaga_budaya: { user_id: user.user_id },
            },
          },
        });
        return count > 0;
      }
      case 'pencairan': {
        const count = await this.prisma.pencairan_dana.count({
          where: {
            bukti_transfer: { endsWith: suffix },
            pengajuan: {
              lembaga_budaya: { user_id: user.user_id },
            },
          },
        });
        return count > 0;
      }
      case 'pengiriman': {
        const count = await this.prisma.pengiriman_sarana.count({
          where: {
            bukti_pengiriman: { endsWith: suffix },
            pengajuan: {
              lembaga_budaya: { user_id: user.user_id },
            },
          },
        });
        return count > 0;
      }
      case 'penolakan': {
        const count = await this.prisma.pengajuan.count({
          where: {
            surat_penolakan_file: { endsWith: suffix },
            lembaga_budaya: { user_id: user.user_id },
          },
        });
        return count > 0;
      }
      default:
        return false;
    }
  }

  private async existsInAnyRecord(
    category: Exclude<FileCategory, 'template'>,
    suffix: string,
  ): Promise<boolean> {
    switch (category) {
      case 'proposal':
        return (
          (await this.prisma.pengajuan.count({
            where: { proposal_file: { endsWith: suffix } },
          })) > 0
        );
      case 'sertifikat':
        return (
          (await this.prisma.sertifikat_nik.count({
            where: { file_path: { endsWith: suffix } },
          })) > 0
        );
      case 'surat':
        return (
          (await this.prisma.surat_persetujuan.count({
            where: { file_path: { endsWith: suffix } },
          })) > 0
        );
      case 'laporan':
        return (
          (await this.prisma.laporan_kegiatan.count({
            where: { file_laporan: { endsWith: suffix } },
          })) > 0
        );
      case 'pencairan':
        return (
          (await this.prisma.pencairan_dana.count({
            where: { bukti_transfer: { endsWith: suffix } },
          })) > 0
        );
      case 'pengiriman':
        return (
          (await this.prisma.pengiriman_sarana.count({
            where: { bukti_pengiriman: { endsWith: suffix } },
          })) > 0
        );
      case 'penolakan':
        return (
          (await this.prisma.pengajuan.count({
            where: { surat_penolakan_file: { endsWith: suffix } },
          })) > 0
        );
      default:
        return false;
    }
  }
}
