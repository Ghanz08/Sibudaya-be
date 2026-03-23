import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreatePengajuanPentasDto } from './create-pengajuan.dto';

describe('CreatePengajuanPentasDto', () => {
  const basePayload = {
    jenis_kegiatan: 'Pentas Seni',
    judul_kegiatan: 'Pentas Budaya 2026',
    tujuan_kegiatan: 'Pelestarian budaya lokal',
    lokasi_kegiatan: 'Gedung Kesenian',
    tanggal_mulai: '2026-07-01',
    tanggal_selesai: '2026-07-02',
    total_pengajuan_dana: '15000000',
    nomor_rekening: '1234567890',
    nama_pemegang_rekening: 'Budi Santoso',
    nama_bank: 'Bank Mandiri',
    alamat_lembaga: 'Jl. Malioboro No. 1',
  };

  it('passes validation when nama_bank is provided', () => {
    const dto = plainToInstance(CreatePengajuanPentasDto, basePayload);
    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when nama_bank is missing', () => {
    const payload: Partial<typeof basePayload> = { ...basePayload };
    delete payload.nama_bank;
    const dto = plainToInstance(CreatePengajuanPentasDto, payload);
    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'nama_bank')).toBe(true);
  });

  it('fails validation when nama_bank is empty', () => {
    const dto = plainToInstance(CreatePengajuanPentasDto, {
      ...basePayload,
      nama_bank: '',
    });
    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'nama_bank')).toBe(true);
  });
});
