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

// ==========================================
// CONFIGURACIÓN PARA ARCHIVOS DE EVENTOS
// ==========================================

// Tipos MIME permitidos para eventos
const EVENT_ALLOWED_MIMES = {
  briefing: ['application/pdf'],
  modset: ['text/html', 'application/xhtml+xml'],
};

// Extensiones permitidas para eventos
const EVENT_ALLOWED_EXTENSIONS = {
  briefing: ['.pdf'],
  modset: ['.html', '.htm'],
};

// Límite de tamaño: 10MB para archivos de eventos
const EVENT_FILE_SIZE_LIMIT = 10 * 1024 * 1024;

// Crear carpeta para archivos de eventos
const eventFilesDir = path.join(process.cwd(), 'public', 'uploads', 'events');
if (!fs.existsSync(eventFilesDir)) {
  fs.mkdirSync(eventFilesDir, { recursive: true });
}

// Storage para briefing PDF
const briefingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, eventFilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    cb(null, `briefing-${uniqueSuffix}.pdf`);
  },
});

// Storage para modset HTML
const modsetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, eventFilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    cb(null, `modset-${uniqueSuffix}.html`);
  },
});

// Filtro para briefing PDF
const briefingFileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Validar MIME type
  if (!EVENT_ALLOWED_MIMES.briefing.includes(file.mimetype)) {
    return cb(new Error('Solo se permiten archivos PDF para el briefing.'));
  }

  // Validar extensión
  const ext = path.extname(file.originalname).toLowerCase();
  if (!EVENT_ALLOWED_EXTENSIONS.briefing.includes(ext)) {
    return cb(new Error('El archivo debe tener extensión .pdf'));
  }

  // Prevenir path traversal
  const basename = path.basename(file.originalname);
  if (basename !== file.originalname || file.originalname.includes('..')) {
    return cb(new Error('Nombre de archivo inválido'));
  }

  cb(null, true);
};

// Filtro para modset HTML
const modsetFileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Validar MIME type
  if (!EVENT_ALLOWED_MIMES.modset.includes(file.mimetype)) {
    return cb(new Error('Solo se permiten archivos HTML para el modset.'));
  }

  // Validar extensión
  const ext = path.extname(file.originalname).toLowerCase();
  if (!EVENT_ALLOWED_EXTENSIONS.modset.includes(ext)) {
    return cb(new Error('El archivo debe tener extensión .html o .htm'));
  }

  // Prevenir path traversal
  const basename = path.basename(file.originalname);
  if (basename !== file.originalname || file.originalname.includes('..')) {
    return cb(new Error('Nombre de archivo inválido'));
  }

  cb(null, true);
};

// Exportar configuraciones para eventos
export const uploadEventBriefing = multer({
  storage: briefingStorage,
  fileFilter: briefingFileFilter,
  limits: {
    fileSize: EVENT_FILE_SIZE_LIMIT, // 10MB
    files: 1,
  },
});

export const uploadEventModset = multer({
  storage: modsetStorage,
  fileFilter: modsetFileFilter,
  limits: {
    fileSize: EVENT_FILE_SIZE_LIMIT, // 10MB
    files: 1,
  },
});

/**
 * Valida que un archivo PDF sea realmente PDF
 */
export const validatePdfFile = async (filePath: string): Promise<boolean> => {
  try {
    const fileType = await fileTypeFromFile(filePath);
    return fileType?.mime === 'application/pdf';
  } catch {
    return false;
  }
};

/**
 * Valida que un archivo HTML sea texto (no tiene magic bytes específicos)
 * Verificamos que el contenido sea texto válido
 */
export const validateHtmlFile = async (filePath: string): Promise<boolean> => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Verificar que contenga estructura HTML básica
    const hasHtmlStructure = content.includes('<') && content.includes('>');
    // Verificar que no contenga scripts maliciosos obvios (básico)
    const hasNoMaliciousScript = !content.includes('javascript:') &&
                                  !content.includes('onerror=') &&
                                  !content.includes('onload=');
    return hasHtmlStructure && hasNoMaliciousScript;
  } catch {
    return false;
  }
};
