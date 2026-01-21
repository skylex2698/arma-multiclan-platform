import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// ========== DIRECTORIO BASE CENTRALIZADO ==========
const BASE_UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Subdirectorios
const CLANS_DIR = path.join(BASE_UPLOAD_DIR, 'clans');
const EVENTS_DIR = path.join(BASE_UPLOAD_DIR, 'events');

// Crear directorios si no existen
if (!fs.existsSync(CLANS_DIR)) {
  fs.mkdirSync(CLANS_DIR, { recursive: true });
}
if (!fs.existsSync(EVENTS_DIR)) {
  fs.mkdirSync(EVENTS_DIR, { recursive: true });
}

// ========== CONFIGURACIÓN PARA AVATARES DE CLANES ==========

const clanStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CLANS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `clan-${uniqueSuffix}${ext}`);
  },
});

const clanFileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, WEBP)'));
  }
};

export const uploadClanAvatar = multer({
  storage: clanStorage,
  fileFilter: clanFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

// ========== CONFIGURACIÓN PARA IMÁGENES DE EVENTOS ==========

const eventsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const eventIdParam = req.params.eventId;
    const eventId = Array.isArray(eventIdParam) ? eventIdParam[0] : (eventIdParam || 'temp');
    const eventDir = path.join(EVENTS_DIR, eventId, 'images');
    
    if (!fs.existsSync(eventDir)) {
      fs.mkdirSync(eventDir, { recursive: true });
    }
    
    cb(null, eventDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'));
  }
};

export const upload = multer({
  storage: eventsStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// ========== FUNCIÓN HELPER ==========

export const deleteFile = (filepath: string): void => {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
};