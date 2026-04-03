import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FasilitasiService } from './fasilitasi.service';

@ApiTags('Fasilitasi')
@Controller('fasilitasi')
export class FasilitasiController {
  constructor(private readonly fasilitasiService: FasilitasiService) {}

  @Get('jenis-lembaga')
  @ApiOperation({ summary: 'Daftar master jenis lembaga' })
  findJenisLembaga() {
    return this.fasilitasiService.findJenisLembaga();
  }

  @Get()
  @ApiOperation({ summary: 'Daftar semua jenis fasilitasi beserta paketnya' })
  findAll() {
    return this.fasilitasiService.findAll();
  }

  @Get(':id/paket')
  @ApiOperation({ summary: 'Daftar paket berdasarkan jenis fasilitasi' })
  findPaket(@Param('id', ParseIntPipe) id: number) {
    return this.fasilitasiService.findPaketByJenis(id);
  }
}
