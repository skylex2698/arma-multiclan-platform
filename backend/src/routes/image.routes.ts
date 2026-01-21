import { Router } from 'express';
import { upload } from '../config/multer.config';
import { imageService } from '../services/image.service';

const router = Router();

// Subir imagen a un evento
router.post('/events/:eventId/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    const eventIdParam = req.params.eventId;
    const eventId = Array.isArray(eventIdParam) ? eventIdParam[0] : eventIdParam;
    
    // Por ahora sin autenticación - puedes añadirla después
    // Si tienes req.user, úsalo, sino usa un ID temporal
    const uploadedBy = (req as any).user?.id || 'system';

    const image = await imageService.uploadImage({
      eventId,
      file: req.file,
      uploadedBy
    });

    res.status(201).json(image);
  } catch (error: any) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: error.message || 'Error al subir la imagen' });
  }
});

// Listar imágenes de un evento
router.get('/events/:eventId/images', async (req, res) => {
  try {
    const eventIdParam = req.params.eventId;
    const eventId = Array.isArray(eventIdParam) ? eventIdParam[0] : eventIdParam;

    const images = await imageService.getEventImages(eventId);

    res.json(images);
  } catch (error: any) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: error.message || 'Error al obtener las imágenes' });
  }
});

// Eliminar imagen
router.delete('/images/:imageId', async (req, res) => {
  try {
    const imageIdParam = req.params.imageId;
    const imageId = Array.isArray(imageIdParam) ? imageIdParam[0] : imageIdParam;
    
    const userId = (req as any).user?.id || 'system';

    const result = await imageService.deleteImage(imageId, userId);

    res.json(result);
  } catch (error: any) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar la imagen' });
  }
});

// Eliminar todas las imágenes de un evento
router.delete('/events/:eventId/images', async (req, res) => {
  try {
    const eventIdParam = req.params.eventId;
    const eventId = Array.isArray(eventIdParam) ? eventIdParam[0] : eventIdParam;

    const result = await imageService.deleteEventImages(eventId);

    res.json(result);
  } catch (error: any) {
    console.error('Error deleting event images:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar las imágenes' });
  }
});

export default router;