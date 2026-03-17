import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/permissions';
import { PERMISSIONS } from '../auth/rbac';
import { feedbackController } from '../controllers/feedback.controller';

const router = Router();

router.use(authenticate);

router.post('/', (req, res) => feedbackController.createFeedback(req, res));
router.get(
  '/',
  requirePermission(PERMISSIONS.FEEDBACK_MANAGE),
  (req, res) => feedbackController.getFeedbackItems(req, res)
);
router.patch(
  '/:id/status',
  requirePermission(PERMISSIONS.FEEDBACK_MANAGE),
  (req, res) => feedbackController.reviewFeedbackItem(req, res)
);

export const feedbackRoutes = router;
