import { Router } from 'express';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/me', auth, async (req, res) => {
  // Get current user profile
});

router.put('/me', auth, async (req, res) => {
  // Update user profile
});

router.get('/me/preferences', auth, async (req, res) => {
  // Get user preferences
});

router.put('/me/preferences', auth, async (req, res) => {
  // Update user preferences
});

export default router; 