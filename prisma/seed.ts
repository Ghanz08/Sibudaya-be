/**
 * Seed Script: Membuat akun USER, ADMIN, dan SUPER_ADMIN pertama kali
 *
 * Cara menjalankan:
 *   npx ts-node prisma/seed.ts
 *
 * Atau tambahkan ke package.json:
 *   "prisma": { "seed": "ts-node prisma/seed.ts" }
 * Lalu jalankan: npx prisma db seed
 */

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type SeedUserConfig = {
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  email: string;
  password: string;
};

async function main() {
  const seedUsers: SeedUserConfig[] = [
    {
      role: 'USER',
      email: process.env.USER_EMAIL ?? 'user@fasilitasi.go.id',
      password: process.env.USER_PASSWORD ?? 'User@2026!',
    },
    {
      role: 'ADMIN',
      email: process.env.ADMIN_EMAIL ?? 'admin@fasilitasi.go.id',
      password: process.env.ADMIN_PASSWORD ?? 'Admin@2026!',
    },
    {
      role: 'SUPER_ADMIN',
      email: process.env.SUPER_ADMIN_EMAIL ?? 'superadmin@fasilitasi.go.id',
      password: process.env.SUPER_ADMIN_PASSWORD ?? 'SuperAdmin@2026!',
    },
  ];

  console.log('Memeriksa akun default USER/ADMIN/SUPER_ADMIN...');

  for (const account of seedUsers) {
    const existing = await prisma.users.findUnique({
      where: { email: account.email },
    });

    if (existing) {
      console.log(`✅ ${account.role} sudah ada (${account.email}).`);
      continue;
    }

    const password_hash = await bcrypt.hash(account.password, 12);

    const createdUser = await prisma.users.create({
      data: {
        email: account.email,
        password_hash,
        role: account.role,
        provider: 'LOCAL',
      },
    });

    console.log(`✅ ${account.role} berhasil dibuat:`);
    console.log(`   ID    : ${createdUser.user_id}`);
    console.log(`   Email : ${createdUser.email}`);
    console.log(`   Role  : ${createdUser.role}`);
  }

  console.log('');
  console.log('⚠️  PENTING: Segera ubah password default setelah login pertama!');

  // ── Seed jenis & paket fasilitasi ────────────────────────────────────────
  console.log('\nMembuat data jenis & paket fasilitasi...');

  await prisma.jenis_fasilitasi.upsert({
    where: { jenis_fasilitasi_id: 1 },
    update: {},
    create: {
      jenis_fasilitasi_id: 1,
      nama: 'Fasilitasi Pentas',
      deskripsi:
        'Bantuan untuk pelaksanaan kegiatan pentas seni dan pembinaan lembaga budaya.',
    },
  });

  await prisma.jenis_fasilitasi.upsert({
    where: { jenis_fasilitasi_id: 2 },
    update: {},
    create: {
      jenis_fasilitasi_id: 2,
      nama: 'Fasilitasi Hibah',
      deskripsi:
        'Bantuan pendukung kegiatan seni seperti gamelan, alat musik, atau pakaian pentas.',
    },
  });

  // Paket Fasilitasi Pentas
  const paketPentas = [
    {
      paket_id: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5',
      nama_paket: 'Paket Pembinaan',
      kuota: 10,
      nilai_bantuan: 60_000_000,
    },
    {
      paket_id: 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6',
      nama_paket: 'Paket A',
      kuota: 20,
      nilai_bantuan: 30_000_000,
    },
    {
      paket_id: 'c3d4e5f6-a7b8-4c9d-0e1f-a2b3c4d5e6f7',
      nama_paket: 'Paket B',
      kuota: 30,
      nilai_bantuan: 20_000_000,
    },
    {
      paket_id: 'd4e5f6a7-b8c9-4d0e-1f2a-b3c4d5e6f7a8',
      nama_paket: 'Paket C',
      kuota: 40,
      nilai_bantuan: 10_000_000,
    },
    {
      paket_id: 'e5f6a7b8-c9d0-4e1f-2a3b-c4d5e6f7a8b9',
      nama_paket: 'Paket D',
      kuota: 50,
      nilai_bantuan: 5_000_000,
    },
  ];
  for (const p of paketPentas) {
    await prisma.paket_fasilitasi.upsert({
      where: { paket_id: p.paket_id },
      update: {},
      create: { jenis_fasilitasi_id: 1, ...p },
    });
  }

  // Paket Fasilitasi Hibah
  const paketHibah = [
    {
      paket_id: 'f6a7b8c9-d0e1-4f2a-3b4c-d5e6f7a8b9c0',
      nama_paket: 'Gamelan Slendro Pelog',
      kuota: 5,
      nilai_bantuan: null,
    },
    {
      paket_id: 'a7b8c9d0-e1f2-4a3b-4c5d-e6f7a8b9c0d1',
      nama_paket: 'Alat Musik Kesenian',
      kuota: 20,
      nilai_bantuan: null,
    },
    {
      paket_id: 'b8c9d0e1-f2a3-4b4c-5d6e-f7a8b9c0d1e2',
      nama_paket: 'Pakaian Kesenian',
      kuota: 30,
      nilai_bantuan: null,
    },
  ];
  for (const p of paketHibah) {
    await prisma.paket_fasilitasi.upsert({
      where: { paket_id: p.paket_id },
      update: {},
      create: { jenis_fasilitasi_id: 2, ...p },
    });
  }

  const jenisLembagaDefaults = [
    'Sanggar',
    'Komunitas Seni',
    'Paguyuban',
    'Lainnya',
  ];

  for (const namaJenisLembaga of jenisLembagaDefaults) {
    await prisma.jenis_lembaga.upsert({
      where: { nama: namaJenisLembaga },
      update: {},
      create: { nama: namaJenisLembaga },
    });
  }

  console.log('✅ Data jenis & paket fasilitasi berhasil dibuat.');
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
