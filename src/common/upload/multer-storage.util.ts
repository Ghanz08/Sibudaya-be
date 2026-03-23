import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';

export type UploadFolder =
  | 'uploads/proposal'
  | 'uploads/sertifikat'
  | 'uploads/surat'
  | 'uploads/laporan'
  | 'uploads/pencairan'
  | 'uploads/pengiriman'
  | 'uploads/penolakan'
  | 'uploads/template';

export function createDiskStorage(folder: UploadFolder) {
  return diskStorage({
    destination: (_req, _file, cb) => {
      const dest = `${process.cwd()}/${folder}`;
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (_req, file, cb) => {
      const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });
}
