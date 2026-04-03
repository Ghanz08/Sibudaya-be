import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { FileFilterCallback } from 'multer';

export const imageAndPdfFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
) => {
  const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowed.includes(file.mimetype)) {
    return callback(
      new BadRequestException(
        'Hanya file PDF, JPG, atau PNG yang diperbolehkan',
      ),
    );
  }
  callback(null, true);
};

export const pdfOnlyFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
) => {
  if (file.mimetype !== 'application/pdf') {
    return callback(new BadRequestException('File wajib dalam format PDF'));
  }
  callback(null, true);
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
