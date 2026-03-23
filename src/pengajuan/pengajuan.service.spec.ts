import { PengajuanService } from './pengajuan.service';

describe('PengajuanService', () => {
  const userId = 'user-1';

  const proposalFile = {
    destination: 'uploads/proposal',
    filename: 'proposal.pdf',
  } as Express.Multer.File;

  const pentasDto = {
    jenis_kegiatan: 'Pentas Seni',
    judul_kegiatan: 'Pentas Budaya 2026',
    tujuan_kegiatan: 'Pelestarian budaya',
    lokasi_kegiatan: 'Gedung Kesenian',
    tanggal_mulai: '2026-07-01',
    tanggal_selesai: '2026-07-03',
    total_pengajuan_dana: 15000000,
    nomor_rekening: '1234567890',
    nama_pemegang_rekening: 'Budi Santoso',
    nama_bank: 'Bank Mandiri',
    alamat_lembaga: 'Jl. Malioboro No. 1',
  };

  function createService() {
    const submissionService = {
      submitPentas: jest
        .fn()
        .mockResolvedValue({ pengajuan_id: 'pengajuan-1' }),
      submitHibah: jest.fn().mockResolvedValue({ pengajuan_id: 'pengajuan-2' }),
    };

    const queryService = {
      findByUser: jest.fn(),
      findDetail: jest.fn(),
    };

    const laporanService = {
      uploadLaporan: jest.fn(),
    };

    const revisionService = {
      revisiPentas: jest.fn(),
      revisiHibah: jest.fn(),
      batalkanPengajuan: jest.fn(),
    };

    return {
      service: new PengajuanService(
        submissionService as any,
        queryService as any,
        laporanService as any,
        revisionService as any,
      ),
      submissionService,
    };
  }

  it('delegates submitPentas to submission service', async () => {
    const { service, submissionService } = createService();

    await service.submitPentas(userId, pentasDto as any, proposalFile);

    expect(submissionService.submitPentas).toHaveBeenCalledWith(
      userId,
      pentasDto,
      proposalFile,
    );
  });

  it('delegates submitHibah to submission service', async () => {
    const { service, submissionService } = createService();
    const hibahDto = {
      jenis_kegiatan: 'Gamelan Slendro Pelog',
      nama_penerima: 'Wayan Sujana',
      email_penerima: 'wayan@email.com',
      no_hp_penerima: '081234567890',
      alamat_pengiriman: 'Jl. Kaliurang No. 10',
      provinsi: 'Daerah Istimewa Yogyakarta',
      kabupaten_kota: 'Sleman',
      kecamatan: 'Depok',
      kelurahan_desa: 'Caturtunggal',
      kode_pos: '55281',
    };

    await service.submitHibah(userId, hibahDto as any, proposalFile);

    expect(submissionService.submitHibah).toHaveBeenCalledWith(
      userId,
      hibahDto,
      proposalFile,
    );
  });
});
