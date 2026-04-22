import express from 'express'; 
import { protect, admin, teacher } from '../middlewares/authMiddleware.js';
import {
  submitQuiz,
  getLeaderboard,
  getMyAchievements,
  createBadge,
  createQuiz,
  getQuizzes,
  getQuizDetails,
  updateQuiz,
  deleteQuiz,
  markDailyStreak,
  getQuizAttendees
} from '../controllers/gamificationController.js';

const router = express.Router();

router.get('/achievements', protect, getMyAchievements);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/quizzes', protect, getQuizzes);
router.get('/quizzes/:id', protect, getQuizDetails);
router.get('/quizzes/:quizId/attendees', protect, admin, getQuizAttendees);
router.post('/quizzes/submit', protect, submitQuiz);
router.post('/mark-streak', protect, markDailyStreak);

// Admin-Only Routes
router.post('/badge', protect, admin, createBadge);

// Teacher/Admin Quiz Creation & Management
router.post('/quizzes', protect, createQuiz);
router.put('/quizzes/:id', protect, updateQuiz);
router.delete('/quizzes/:id', protect, admin, deleteQuiz);

export default router;
