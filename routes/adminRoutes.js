import express from 'express';
import { getPlatformStats } from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, restrictTo('admin'));

router.get('/stats', getPlatformStats);

export default router;