import { PrismaClient, Prisma } from '@prisma/client';

// Modelos que usan soft delete (tienen campo deletedAt)
const SOFT_DELETE_MODELS: Prisma.ModelName[] = ['Event', 'Clan', 'Squad', 'Slot', 'User'];

/**
 * Middleware de Prisma que implementa soft deletes:
 *
 * - LECTURAS (findMany, findFirst, count, aggregate, groupBy):
 *   Añade automáticamente `deletedAt: null` al where, filtrando registros borrados.
 *   Si el código pone explícitamente `deletedAt` (cualquier valor), no lo sobreescribe.
 *
 * - findUnique / findUniqueOrThrow:
 *   Convierte a findFirst / findFirstOrThrow y añade `deletedAt: null`.
 *
 * - delete:
 *   Convierte a update con `data: { deletedAt: new Date() }`.
 *
 * - deleteMany:
 *   Convierte a updateMany con `data: { deletedAt: new Date() }`.
 */
export function softDeleteMiddleware(prisma: PrismaClient): void {
  prisma.$use(async (params, next) => {
    if (!params.model || !SOFT_DELETE_MODELS.includes(params.model as Prisma.ModelName)) {
      return next(params);
    }

    // --- LECTURAS: auto-filtrar registros soft-deleted ---

    if (
      params.action === 'findFirst' ||
      params.action === 'findMany' ||
      params.action === 'count' ||
      params.action === 'aggregate' ||
      params.action === 'groupBy'
    ) {
      if (!params.args) {
        params.args = {};
      }
      if (!params.args.where) {
        params.args.where = {};
      }
      // Solo añadir filtro si no se especificó explícitamente deletedAt
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    }

    // --- findUnique → findFirst (para poder añadir deletedAt al where) ---

    if (params.action === 'findUnique' || params.action === 'findUniqueOrThrow') {
      if (!params.args) {
        params.args = {};
      }
      if (!params.args.where) {
        params.args.where = {};
      }
      // Solo filtrar si no se especificó explícitamente deletedAt
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
        // Convertir a findFirst para soportar el campo no-único deletedAt
        if (params.action === 'findUnique') {
          params.action = 'findFirst';
        } else {
          params.action = 'findFirstOrThrow';
        }
      }
    }

    // --- DELETE → UPDATE (soft delete) ---

    if (params.action === 'delete') {
      params.action = 'update';
      params.args.data = { deletedAt: new Date() };
    }

    // --- DELETE MANY → UPDATE MANY (soft delete) ---

    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      if (!params.args) {
        params.args = {};
      }
      if (params.args.data) {
        params.args.data.deletedAt = new Date();
      } else {
        params.args.data = { deletedAt: new Date() };
      }
    }

    return next(params);
  });
}
