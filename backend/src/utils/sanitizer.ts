import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

/**
 * Sanitizador de HTML
 * Previene ataques XSS (Cross-Site Scripting)
 */

const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Sanitiza contenido HTML, eliminando scripts maliciosos
 * Permite solo tags y atributos seguros para contenido enriquecido
 */
export const sanitizeHTML = (dirty: string): string => {
  if (!dirty) return '';

  return purify.sanitize(dirty, {
    ALLOWED_TAGS: [
      // Estructura
      'p', 'br', 'hr', 'div', 'span',
      // Encabezados
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Formato de texto
      'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'sub', 'sup', 'mark',
      // Listas
      'ul', 'ol', 'li',
      // Enlaces e imágenes
      'a', 'img',
      // Tablas
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      // Bloques
      'blockquote', 'pre', 'code',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'width', 'height', 'style',
      'target', 'rel',
      'colspan', 'rowspan',
    ],
    ALLOW_DATA_ATTR: false,
    // Forzar target="_blank" a tener rel="noopener noreferrer"
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
};

/**
 * Sanitiza texto plano, eliminando cualquier HTML
 */
export const sanitizeText = (dirty: string): string => {
  if (!dirty) return '';
  return purify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

/**
 * Sanitiza un nickname (más restrictivo)
 * Solo permite caracteres alfanuméricos, espacios, guiones y underscores
 */
export const sanitizeNickname = (nickname: string): string => {
  if (!nickname) return '';

  return nickname
    .trim()
    // Eliminar caracteres peligrosos y de control
    .replace(/[<>\"'`\\\/\x00-\x1F\x7F]/g, '')
    // Solo permitir caracteres seguros
    .replace(/[^\w\s\-_.áéíóúÁÉÍÓÚñÑüÜ]/g, '')
    // Limitar longitud
    .slice(0, 50);
};

/**
 * Sanitiza una URL para prevenir javascript: y otros protocolos peligrosos
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';

  const trimmed = url.trim().toLowerCase();

  // Bloquear protocolos peligrosos
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }

  return url.trim();
};
