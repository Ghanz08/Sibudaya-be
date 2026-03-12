import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  /**
   * Delete a file from disk if it exists.
   * @param filePath relative path stored in DB (e.g. "uploads/proposal/file.pdf")
   */
  deleteFile(filePath: string | null | undefined): void {
    if (!filePath) return;
    const abs = path.join(process.cwd(), filePath);
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
    }
  }

  /**
   * Build the public-accessible path to store in DB.
   * multer destination is already relative from project root.
   */
  buildFilePath(destination: string, filename: string): string {
    return path.join(destination, filename).replace(/\\/g, '/');
  }
}
