/**
 * Seed Script: Membuat akun SUPER_ADMIN pertama kali
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

async function main() {
  const SUPER_ADMIN_EMAIL =
    process.env.SUPER_ADMIN_EMAIL ?? 'superadmin@fasilitasi.go.id';
  const SUPER_ADMIN_PASSWORD =
    process.env.SUPER_ADMIN_PASSWORD ?? 'SuperAdmin@2026!';

  console.log(`Memeriksa SUPER_ADMIN: ${SUPER_ADMIN_EMAIL}`);

  const existing = await prisma.users.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
  });

  if (existing) {
    console.log('✅ SUPER_ADMIN sudah ada, seed dilewati.');
    return;
  }

  const password_hash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

  const superAdmin = await prisma.users.create({
    data: {
      email: SUPER_ADMIN_EMAIL,
      password_hash,
      role: 'SUPER_ADMIN',
      provider: 'LOCAL',
    },
  });

  console.log('✅ SUPER_ADMIN berhasil dibuat:');
  console.log(`   ID    : ${superAdmin.user_id}`);
  console.log(`   Email : ${superAdmin.email}`);
  console.log(`   Role  : ${superAdmin.role}`);
  console.log('');
  console.log(
    '⚠️  PENTING: Segera ubah password default setelah login pertama!',
  );
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
