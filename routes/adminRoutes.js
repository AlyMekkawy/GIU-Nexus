const express = 'express';
const { getPlatformStats } = ('../controllers/adminController.js');
const { protect, restrictTo } = ('../middleware/authMiddleware.js');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, restrictTo('admin'));

router.get('/stats', getPlatformStats);

export default router;