import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotifikasiService } from './notifikasi.service';

@ApiTags('Notifikasi')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifikasi')
export class NotifikasiController {
  constructor(private readonly notifikasiService: NotifikasiService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar notifikasi saya' })
  findAll(@CurrentUser() user: { user_id: string }) {
    return this.notifikasiService.findByUser(user.user_id);
  }

  @Patch(':id/baca')
  @ApiOperation({ summary: 'Tandai notifikasi sudah dibaca' })
  baca(@Param('id') id: string, @CurrentUser() user: { user_id: string }) {
    return this.notifikasiService.bacaNotifikasi(id, user.user_id);
  }

  @Patch('baca-semua')
  @ApiOperation({ summary: 'Tandai semua notifikasi sudah dibaca' })
  bacaSemua(@CurrentUser() user: { user_id: string }) {
    return this.notifikasiService.bacaSemua(user.user_id);
  }
}
