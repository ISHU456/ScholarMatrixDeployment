import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  registerFace,
  loginWithFace,
  updatePulse,
  getCourseActivity,
  getLeaderboard,
  getStudentProfileByTeacher,
  getAttendanceHistory,
  getAnnualAttendanceReport,
  getNextRollNumber
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { storage } from '../config/cloudinary.js';
import multer from 'multer';

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 } // Increased to 20MB
});
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/leaderboard', getLeaderboard);
// router.post('/login-face', loginWithFace);
// router.post('/register-face', protect, registerFace);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, (req, res, next) => {
    // Explicit Multer Error Trapping
    upload.single('profilePic')(req, res, (err) => {
      if (err) {
        console.error('CRITICAL MULTER FAILURE:', err);
        return res.status(400).json({ 
          message: 'Server failed to capture the image file.', 
          error: err.message,
          code: err.code || 'MULTER_ERROR'
        });
      }
      // Multer success - proceed to controller
      next();
    });
  }, updateUserProfile);
router.post('/forgot-password', forgotPassword);
router.post('/pulse', protect, updatePulse);
router.get('/course-activity/:courseId', getCourseActivity);
router.get('/student-profile/:studentId', protect, getStudentProfileByTeacher);
router.get('/attendance/history', protect, getAttendanceHistory);
router.get('/attendance/annual-report', protect, getAnnualAttendanceReport);
router.get('/next-roll-number', getNextRollNumber);

export default router;
