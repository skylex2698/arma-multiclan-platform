// Servicio para gestionar imágenes de eventos

import { prisma } from '../index';
import { logger } from '../utils/logger';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export class ImageService {
  // Subir imagen
  async uploadImage(data: {
    eventId: string;
    file: Express.Multer.File;
    uploadedBy: string;
  }) {
    const { eventId, file, uploadedBy } = data;

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    // Optimizar imagen con sharp
    const optimizedPath = path.join(
      path.dirname(file.path),
      `optimized-${file.filename}`
    );

    await sharp(file.path)
      .resize(1920, 1080, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(optimizedPath);

    // Eliminar original
    fs.unlinkSync(file.path);

    // Renombrar optimizado al nombre original
    fs.renameSync(optimizedPath, file.path);

    // Obtener info del archivo optimizado
    const stats = fs.statSync(file.path);

    // Crear URL pública
    const url = `/uploads/events/${eventId}/images/${file.filename}`;

    // Guardar en BD
    const image = await prisma.image.create({
      data: {
        eventId,
        filename: file.filename,
        originalName: file.originalname,
        url,
        size: stats.size,
        mimetype: file.mimetype,
        uploadedBy
      },
      include: {
        uploadedByUser: {
          select: {
            id: true,
            nickname: true
          }
        }
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'IMAGE_UPLOADED',
        entity: 'Image',
        entityId: image.id,
        userId: uploadedBy,
        eventId,
        details: JSON.stringify({
          filename: file.originalname,
          size: stats.size
        })
      }
    });

    logger.info('Image uploaded', { imageId: image.id, eventId, uploadedBy });

    return image;
  }

  // Listar imágenes de un evento
  async getEventImages(eventId: string) {
    const images = await prisma.image.findMany({
      where: { eventId },
      include: {
        uploadedByUser: {
          select: {
            id: true,
            nickname: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return images;
  }

  // Eliminar imagen
  async deleteImage(imageId: string, userId: string) {
    const image = await prisma.image.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      throw new Error('Imagen no encontrada');
    }

    // Eliminar archivo físico
    const filepath = path.join(
      __dirname,
      '../../uploads/events',
      image.eventId,
      'images',
      image.filename
    );

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Eliminar de BD
    await prisma.image.delete({
      where: { id: imageId }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'IMAGE_DELETED',
        entity: 'Image',
        entityId: imageId,
        userId,
        eventId: image.eventId,
        details: JSON.stringify({
          filename: image.originalName
        })
      }
    });

    logger.info('Image deleted', { imageId, userId });

    return { success: true };
  }

  // Eliminar todas las imágenes de un evento
  async deleteEventImages(eventId: string) {
    const images = await prisma.image.findMany({
      where: { eventId }
    });

    for (const image of images) {
      const filepath = path.join(
        __dirname,
        '../../uploads/events',
        eventId,
        'images',
        image.filename
      );

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    await prisma.image.deleteMany({
      where: { eventId }
    });

    logger.info('Event images deleted', { eventId, count: images.length });

    return { success: true, deletedCount: images.length };
  }
}

export const imageService = new ImageService();