import { PengajuanService } from './pengajuan.service';
import { STATUS } from '../common/constants/status.constants';

describe('PengajuanService', () => {
  const userId = 'user-1';
  const lembagaId = 'lembaga-1';

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
    const prisma = {
      lembaga_budaya: {
        findUnique: jest.fn().mockResolvedValue({ lembaga_id: lembagaId }),
      },
      pengajuan: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            pengajuan_id: 'pengajuan-1',
            ...data,
          }),
        ),
      },
    };

    const uploadService = {
      buildFilePath: jest.fn().mockReturnValue('uploads/proposal/proposal.pdf'),
      deleteFile: jest.fn(),
    };

    const notifikasiService = {
      kirimKeAdminDanSuperAdmin: jest.fn().mockResolvedValue(undefined),
    };

    return {
      service: new PengajuanService(
        prisma as any,
        uploadService as any,
        notifikasiService as any,
      ),
      prisma,
      uploadService,
      notifikasiService,
    };
  }

  it('stores nama_bank when submitting pentas', async () => {
    const { service, prisma } = createService();

    await service.submitPentas(userId, pentasDto as any, proposalFile);

    expect(prisma.pengajuan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          jenis_fasilitasi_id: 1,
          nama_bank: 'Bank Mandiri',
        }),
      }),
    );
  });

  it('keeps hibah flow unchanged without nama_bank', async () => {
    const { service, prisma } = createService();
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

    expect(prisma.pengajuan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          jenis_fasilitasi_id: 2,
          nama_penerima: hibahDto.nama_penerima,
          status: STATUS.DALAM_PROSES,
        }),
      }),
    );

    const createArg = (prisma.pengajuan.create as jest.Mock).mock.calls[0][0];
    expect(createArg.data.nama_bank).toBeUndefined();
  });
});
