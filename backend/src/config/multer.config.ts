import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileTypeFromFile } from 'file-type';

/**
 * Configuración segura de Multer para subida de archivos
 * Incluye validación de MIME, extensión y magic bytes
 */

// Tipos MIME permitidos
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

// Extensiones permitidas
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Mapa de MIME a extensión segura
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// Crear carpetas si no existen
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'clans');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento seguro
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único usando crypto (más seguro que Math.random)
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');

    // Usar extensión basada en el MIME type, NO en el nombre original
    // Esto previene ataques de doble extensión (archivo.jpg.php)
    const ext = MIME_TO_EXT[file.mimetype] || '.jpg';

    cb(null, `clan-${uniqueSuffix}${ext}`);
  },
});

// Filtro de archivos mejorado
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // 1. Validar MIME type declarado
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG o WEBP.'));
  }

  // 2. Validar extensión del nombre original
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Extensión de archivo no permitida. Solo se permiten .jpg, .jpeg, .png o .webp'));
  }

  // 3. Prevenir path traversal en el nombre
  const basename = path.basename(file.originalname);
  if (basename !== file.originalname || file.originalname.includes('..')) {
    return cb(new Error('Nombre de archivo inválido'));
  }

  cb(null, true);
};

// Configurar multer
export const uploadClanAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB máximo (reducido de 5MB)
    files: 1, // Solo un archivo a la vez
  },
});

/**
 * Valida los magic bytes del archivo después de la subida
 * Debe llamarse en el controller después del upload
 * @param filePath - Ruta del archivo subido
 * @returns true si es válido, false si no
 */
export const validateFileType = async (filePath: string): Promise<boolean> => {
  try {
    const fileType = await fileTypeFromFile(filePath);

    if (!fileType) {
      return false;
    }

    // Verificar que el tipo real coincida con los permitidos
    return ALLOWED_MIMES.includes(fileType.mime);
  } catch (error) {
    return false;
  }
};

/**
 * Elimina un archivo de forma segura
 * @param filePath - Ruta del archivo a eliminar
 */
export const deleteFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};
