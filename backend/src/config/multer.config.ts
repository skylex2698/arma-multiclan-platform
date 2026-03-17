import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileTypeFromFile } from 'file-type';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

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

const clanArchiveDir = path.join(process.cwd(), 'storage', 'archived', 'clans');
if (!fs.existsSync(clanArchiveDir)) {
  fs.mkdirSync(clanArchiveDir, { recursive: true });
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

export const archiveClanAvatar = (publicUrl: string): { archivedPath: string; archivedFilename: string } | null => {
  const filename = path.basename(publicUrl);
  const currentPath = path.join(uploadDir, filename);

  if (!fs.existsSync(currentPath)) {
    return null;
  }

  const archivedFilename = `archived-${Date.now()}-${filename}`;
  const archivedPath = path.join(clanArchiveDir, archivedFilename);
  fs.renameSync(currentPath, archivedPath);

  return { archivedPath, archivedFilename };
};

export const restoreArchivedClanAvatar = (archivedFilename: string): string | null => {
  const archivedPath = path.join(clanArchiveDir, archivedFilename);
  if (!fs.existsSync(archivedPath)) {
    return null;
  }

  const restoredFilename = archivedFilename.replace(/^archived-\d+-/, '');
  const restoredPath = path.join(uploadDir, restoredFilename);
  fs.renameSync(archivedPath, restoredPath);

  return `/uploads/clans/${restoredFilename}`;
};

export const purgeArchivedClanAvatar = (archivedFilename: string): void => {
  const archivedPath = path.join(clanArchiveDir, archivedFilename);
  deleteFile(archivedPath);
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
 * Sanitiza y valida un archivo HTML de modset de Arma 3 Launcher.
 *
 * En lugar de solo validar (rechazar/aceptar), sanitiza el HTML con DOMPurify
 * eliminando cualquier contenido peligroso (scripts, iframes, event handlers,
 * javascript: URIs, etc.) y luego verifica que sea un preset válido de Arma 3.
 *
 * El archivo sanitizado se sobreescribe en disco, de modo que el HTML servido
 * siempre es seguro.
 *
 * @returns { valid: boolean; reason?: string }
 */
export const sanitizeAndValidateModsetHtml = async (
  filePath: string
): Promise<{ valid: boolean; reason?: string }> => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Sanity check básico
    if (!content.trim() || content.length < 10) {
      return { valid: false, reason: 'El archivo está vacío o es demasiado pequeño' };
    }

    // Crear instancia de DOMPurify con JSDOM
    const dom = new JSDOM('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const purify = DOMPurify(dom.window as any);

    // Sanitizar con DOMPurify — config específica para modsets de Arma 3
    const sanitized = purify.sanitize(content, {
      WHOLE_DOCUMENT: true,
      ALLOWED_TAGS: [
        // Estructura del documento
        'html', 'head', 'body', 'meta', 'title', 'style', 'link',
        // Tablas (estructura principal de los presets)
        'table', 'thead', 'tbody', 'tr', 'td', 'th',
        // Contenido
        'a', 'span', 'div', 'p',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'br', 'hr', 'img',
        'strong', 'b', 'em', 'i', 'u',
        'ul', 'ol', 'li',
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'id', 'style',
        'target', 'rel', 'colspan', 'rowspan',
        'name', 'content', 'charset', 'http-equiv', // meta
        'type',   // link type
        'width', 'height',
      ],
      ALLOW_DATA_ATTR: true, // data-type="ModContainer", etc.
      FORBID_TAGS: [
        'script', 'iframe', 'object', 'embed', 'form', 'input',
        'button', 'textarea', 'select', 'applet', 'base', 'svg', 'math',
      ],
      FORBID_ATTR: [
        'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus',
        'onblur', 'onmouseout', 'onkeydown', 'onkeyup', 'onsubmit',
      ],
    });

    // Verificar estructura de Arma 3 en el contenido sanitizado
    const sanitizedDom = new JSDOM(sanitized);
    const doc = sanitizedDom.window.document;

    const armaMeta = doc.querySelector('meta[name^="arma:"]');
    const modContainers = doc.querySelectorAll('tr[data-type="ModContainer"]');

    if (!armaMeta && modContainers.length === 0) {
      return {
        valid: false,
        reason: 'El archivo no parece ser un preset válido de Arma 3 Launcher. '
          + 'Debe contener metadatos arma: o contenedores de mods (tr[data-type="ModContainer"]).',
      };
    }

    // Guardar versión sanitizada (sobreescribe el original)
    fs.writeFileSync(filePath, sanitized, 'utf-8');

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Error al procesar el archivo HTML' };
  }
};
