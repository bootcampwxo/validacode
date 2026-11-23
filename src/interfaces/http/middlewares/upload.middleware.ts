import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../../config';
import { ValidationError } from '../../../domain/exceptions';

// Garante que o diretório de upload exista
if (!fs.existsSync(config.uploads.dir)) {
  fs.mkdirSync(config.uploads.dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploads.dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

export const uploadReceiptMiddleware = multer({
  storage,
  limits: {
    fileSize: config.uploads.maxFileSizeMb * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (config.uploads.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ValidationError(
          `Formato de arquivo '${file.mimetype}' não suportado. Formatos aceitos: [${config.uploads.allowedMimeTypes.join(', ')}]`
        )
      );
    }
  },
});
