import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
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
      const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });
}
