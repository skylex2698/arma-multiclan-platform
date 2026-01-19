import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Crear carpetas si no existen
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'clans');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `clan-${uniqueSuffix}${ext}`);
  },
});

// Filtro de archivos (solo imágenes)
const fileFilter = (
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

// Configurar multer
export const uploadClanAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});