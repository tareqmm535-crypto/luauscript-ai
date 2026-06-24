import { Router } from 'express';
import { authRouter } from './auth.js';


export const router = Router();

// API status
router.get('/', (req, res) => {
  res.json({ api: 'Agent Tree API', version: '1.0.0' });
});

router.use('/auth', authRouter);


// Example: Users endpoint
router.get('/users', async (req, res, next) => {
  try {
    // TODO: Replace with DB query
    const users = [
      { id: 1, name: 'User 1', email: 'user1@example.com' },
      { id: 2, name: 'User 2', email: 'user2@example.com' }
    ];
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});