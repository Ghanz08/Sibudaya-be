# Sibudaya — Sistem Informasi Layanan Fasilitasi Lembaga Budaya

Backend API untuk sistem pengelolaan pengajuan fasilitasi lembaga budaya pada Dinas terkait.

## Tech Stack

- **Framework** — NestJS (Node.js)
- **ORM** — Prisma v7
- **Database** — PostgreSQL
- **Auth** — Passport.js (JWT + Google OAuth 2.0)
- **Dokumentasi API** — Swagger UI

---

## Instalasi Tools (dari Nol)

> Lewati bagian yang sudah terinstall di mesin kamu.

### Node.js v18+

**Windows / macOS / Linux** — Download installer dari:
[https://nodejs.org](https://nodejs.org) (pilih versi **LTS**)

Verifikasi:

```bash
node -v   # harus v18 ke atas
npm -v
```

---

### pnpm

```bash
npm install -g pnpm
```

Verifikasi:

```bash
pnpm -v
```

---

### PostgreSQL

**macOS (Homebrew):**

```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu / Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download installer di: [https://www.postgresql.org/download/windows](https://www.postgresql.org/download/windows)

- Centang komponen: **PostgreSQL Server** + **Command Line Tools**
- Catat password yang kamu set untuk user `postgres`
- Setelah install, tambahkan ke PATH: `C:\Program Files\PostgreSQL\16\bin`

Verifikasi (semua OS):

```bash
psql --version
```

---

## Setup Project

### 1. Clone repository

```bash
git clone https://github.com/Ghanz08/Sibudaya.git
cd Sibudaya
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Buat database PostgreSQL

**macOS / Linux:**

```bash
createdb fasilitasi_dinas
```

**Windows** (buka Command Prompt sebagai Administrator):

```bash
createdb -U postgres fasilitasi_dinas
```

> Masukkan password postgres kamu jika diminta.

Atau lewat `psql` (berlaku semua OS):

```bash
psql -U postgres -c "CREATE DATABASE fasilitasi_dinas;"
```

### 4. Buat file `.env`

Copy dari template:

```bash
cp .env.example .env
```

Lalu edit `.env` sesuai konfigurasi lokal:

```dotenv
# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/fasilitasi_dinas"

# App
PORT=3000
FRONTEND_URL=http://localhost:3000

# JWT — generate dengan perintah di bawah
JWT_SECRET=isi_dengan_random_64_bytes
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=isi_dengan_random_64_bytes_berbeda
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Resend Email — https://resend.com/api-keys
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev

# (Opsional) Override default seed credentials
SUPER_ADMIN_EMAIL=superadmin@fasilitasi.go.id
SUPER_ADMIN_PASSWORD=SuperAdmin@2026!
```

> **Generate JWT Secret:**
>
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```
>
> Jalankan dua kali — hasilnya berbeda untuk `JWT_SECRET` dan `JWT_REFRESH_SECRET`.

### 5. Jalankan migrasi

```bash
npx prisma migrate deploy
```

### 6. Generate Prisma Client

```bash
npx prisma generate
```

### 7. Seed SUPER_ADMIN

```bash
npx ts-node --project tsconfig.json prisma/seed.ts
```

Akun default yang dibuat:
| Field | Value |
|-------|-------|
| Email | `superadmin@fasilitasi.go.id` |
| Password | `SuperAdmin@2026!` |
| Role | `SUPER_ADMIN` |

> ⚠️ Segera ganti password setelah login pertama.

### 8. Jalankan server

```bash
# Development (watch mode)
pnpm start:dev

# Production
pnpm build
pnpm start:prod
```

Server berjalan di: `http://localhost:3000`

---

## Dokumentasi API (Swagger)

Buka di browser:

```
http://localhost:3000/api/docs
```

### Cara test endpoint protected di Swagger:

1. Login via `POST /api/v1/auth/login`
2. Copy `access_token` dari response
3. Klik tombol **🔒 Authorize** di pojok kanan atas
4. Paste token → **Authorize**
5. Semua endpoint protected sekarang bisa diakses

---

## Endpoint Auth

Base URL: `/api/v1/auth`

| Method | Endpoint            | Deskripsi                                  | Auth       |
| ------ | ------------------- | ------------------------------------------ | ---------- |
| `POST` | `/register`         | Register user baru (role: USER)            | —          |
| `POST` | `/login`            | Login email & password                     | —          |
| `POST` | `/refresh`          | Tukar refresh_token → access_token baru    | —          |
| `POST` | `/forgot-password`  | Request reset password                     | —          |
| `POST` | `/reset-password`   | Reset password dengan token                | —          |
| `GET`  | `/google`           | Redirect ke halaman login Google           | —          |
| `GET`  | `/google/callback`  | Callback Google OAuth, redirect ke frontend callback + token query params | —          |
| `GET`  | `/me`               | Data user yang sedang login                | JWT        |
| `GET`  | `/admin-only`       | Contoh endpoint khusus ADMIN & SUPER_ADMIN | JWT + Role |
| `GET`  | `/super-admin-only` | Contoh endpoint khusus SUPER_ADMIN         | JWT + Role |

### Contoh Request & Response

**Register**

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "provider": "LOCAL",
    "created_at": "2026-03-03T00:00:00.000Z"
  }
}
```

**Login**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "superadmin@fasilitasi.go.id",
  "password": "SuperAdmin@2026!"
}
```

**Akses endpoint protected**

```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

**Refresh token**

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ..."
}
```

---

## Role & Akses

| Role          | Deskripsi                                       |
| ------------- | ----------------------------------------------- |
| `USER`        | Lembaga Budaya — mengajukan fasilitasi          |
| `ADMIN`       | Admin Dinas — review dan approve pengajuan      |
| `SUPER_ADMIN` | Pengelola sistem — manage admin dan konfigurasi |

---

## Struktur Folder

```
src/
├── admin/
│   └── pengajuan/        # Review & approval pengajuan oleh admin
├── auth/
│   ├── decorators/       # @Roles(), @CurrentUser()
│   ├── dto/              # RegisterDto, LoginDto, ForgotPasswordDto, dll
│   ├── guards/           # JwtAuthGuard, RolesGuard, dll
│   ├── strategies/       # LocalStrategy, JwtStrategy, GoogleStrategy
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── common/
│   └── upload/           # Multer storage & file filter utility
├── fasilitasi/           # Module fasilitasi lembaga budaya
├── lembaga/              # Module data lembaga budaya
├── mail/                 # Mail service (Resend) — reset password email
├── notifikasi/           # Module notifikasi
├── pengajuan/            # Pengajuan fasilitasi (user-facing)
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts
└── main.ts
prisma/
├── schema.prisma
├── seed.ts
└── migrations/
uploads/                  # File upload (proposal, laporan, dll) — jangan di-commit
```

---

## Environment Variables

| Variable                 | Wajib  | Deskripsi                                                               |
| ------------------------ | ------ | ----------------------------------------------------------------------- |
| `DATABASE_URL`           | ✅     | PostgreSQL connection string                                            |
| `JWT_SECRET`             | ✅     | Secret untuk signing access token                                       |
| `JWT_EXPIRES_IN`         | ✅     | Masa berlaku access token (contoh: `15m`)                               |
| `JWT_REFRESH_SECRET`     | ✅     | Secret untuk signing refresh token                                      |
| `JWT_REFRESH_EXPIRES_IN` | ✅     | Masa berlaku refresh token (contoh: `7d`)                               |
| `GOOGLE_CLIENT_ID`       | ✅\*   | Google OAuth Client ID                                                  |
| `GOOGLE_CLIENT_SECRET`   | ✅\*   | Google OAuth Client Secret                                              |
| `GOOGLE_CALLBACK_URL`    | ✅\*   | URL callback Google OAuth                                               |
| `RESEND_API_KEY`         | ✅\*\* | API key Resend untuk kirim email                                        |
| `RESEND_FROM_EMAIL`      | —      | Alamat pengirim email (default: `onboarding@resend.dev`)                |
| `PORT`                   | —      | Port server (default: `3000`)                                           |
| `FRONTEND_URL`           | —      | URL frontend untuk link email, redirect OAuth callback, dan CORS (default: `http://localhost:3000`) |
| `SUPER_ADMIN_EMAIL`      | —      | Email akun SUPER_ADMIN saat seed (default sudah ada)                    |
| `SUPER_ADMIN_PASSWORD`   | —      | Password akun SUPER_ADMIN saat seed (default sudah ada)                 |

\*Wajib jika menggunakan fitur Google OAuth.  
\*\*Wajib jika menggunakan fitur forgot/reset password via email.
