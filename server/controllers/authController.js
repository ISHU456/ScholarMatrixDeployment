import User from '../models/User.js';
import Progress from '../models/Progress.js';
import FacultyFace from '../models/FacultyFace.js';
import Course from '../models/Course.js';
import Department from '../models/Department.js';
import Submission from '../models/Submission.js';
import generateToken from '../utils/generateToken.js';
import { cloudinary, verifyCloudinaryConfig } from '../config/cloudinary.js';
import mongoose from 'mongoose';
import MFASession from '../models/MFASession.js';
import SystemSettings from '../models/SystemSettings.js';
import crypto from 'crypto';

// Verify college email domain helper
const isValidCollegeEmail = (email) => {
  return email.endsWith('@college.edu') || email.endsWith('@student.college.edu');
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { 
      name, email, password, role, dob, address, contact, 
      enrollmentNumber, batch, department, year, semester, rollNumber,
      employeeId, securityQuestion, securityAnswer, descriptors, profilePic
    } = req.body;
    
    // Check if registration is open
    const settings = await SystemSettings.findOne();
    if (settings && !settings.registrationOpen && role !== 'admin') {
      return res.status(403).json({ message: 'Enrollment Portal is currently restricted by administration.' });
    }

    let finalProfilePic = profilePic;
    let finalProfileImage = { url: '', publicId: '' };

    if (profilePic && profilePic.startsWith('data:image')) {
      const uploadRes = await cloudinary.uploader.upload(profilePic, {
        folder: 'lms_images',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' }
        ]
      });
      finalProfilePic = uploadRes.secure_url;
      finalProfileImage = {
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id
      };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const initialCoins = (role === 'teacher' || role === 'hod' || role === 'admin') ? 50 : 10;
    // For teacher approval workflow
    const isTeacher = role === 'teacher';
    const finalIsActive = role === 'student' ? false : (isTeacher ? false : true);
    const finalIsAuthorized = isTeacher ? false : true;
    const finalRegToken = isTeacher ? Math.floor(100000 + Math.random() * 900000).toString() : undefined;

    const userEmailVerified = (role === 'teacher' || role === 'hod' || role === 'admin');

    const user = await User.create({
      name, email: normalizedEmail, password, role, dob, address, contact, 
      enrollmentNumber, batch, department, year, semester, rollNumber,
      employeeId, securityQuestion, securityAnswer, profilePic: finalProfilePic,
      profileImage: finalProfileImage,
      coins: initialCoins,
      isEmailVerified: userEmailVerified,
      isActive: finalIsActive,
      isAuthorized: finalIsAuthorized,
      registrationToken: finalRegToken
    });

    if (user) {
      if (isTeacher && !finalIsAuthorized) {
        return res.status(201).json({
           isPendingAuth: true,
           registrationToken: finalRegToken,
           message: 'Registration successful. Pending admin authorization.'
        });
      }

      res.status(201).json({
        _id: user._id, name: user.name, email: user.email, role: user.role,
        department: user.department, assignedSemesters: user.assignedSemesters,
        semester: user.semester, enrollmentNumber: user.enrollmentNumber, batch: user.batch,
        profilePic: user.profilePic, 
        coins: user.coins,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user && (await user.matchPassword(password))) {
      // Allow login for unauthorized teachers but they will be restricted by ProtectedRoute
      if (!user.isActive || !user.isAuthorized) {
          if (user.role === 'teacher') {
              // We return the user with a token but they will be caught by frontend ProtectedRoute
              return res.json({
                  _id: user._id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  isAuthorized: false,
                  registrationToken: user.registrationToken,
                  token: generateToken(user._id),
              });
          }
          
          const msg = user.role === 'student' ? 'Account pending administrative approval.' : 'Account deactivated. Contact system admin.';
          return res.status(403).json({ message: msg });
      }
      
      if (user.faceRegistered) {
        const tempTokenRaw = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(tempTokenRaw).digest('hex');
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await MFASession.create({
          user: user._id,
          tempToken: hashedToken,
          expiresAt
        });

        return res.json({
          requires2FA: true,
          tempToken: tempTokenRaw,
          userId: user._id,
          message: 'Face verification required'
        });
      }

      res.json({
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        department: user.department, 
        assignedSemesters: user.assignedSemesters,
        semester: user.semester, 
        enrollmentNumber: user.enrollmentNumber, 
        batch: user.batch,
        profilePic: user.profilePic, 
        coins: user.coins,
        faceRegistered: !!user.faceRegistered, // Force boolean
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -securityAnswer');
    if (user) res.json(user);
    else res.status(404).json({ message: 'User not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  const { isConfigured, cloud_name } = verifyCloudinaryConfig();
  if (!isConfigured) {
    return res.status(500).json({ 
      message: 'CRITICAL ERROR: Cloudinary is not configured on this server. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.' 
    });
  }
  
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.contact = req.body.contact || user.contact;
      user.address = req.body.address || user.address;
      user.department = req.body.department || user.department;
      user.dob = req.body.dob || user.dob;
      user.aboutMe = req.body.aboutMe || user.aboutMe;
      user.qualification = req.body.qualification || user.qualification;
      
      // Handle Profile Picture
      if (req.file) {
        try {
          console.log("--- CLOUDINARY UPLOAD SUCCESS ---");
          user.profilePic = req.file.path;
          user.profileImage = {
            url: req.file.path,
            publicId: req.file.filename
          };
        } catch (uploadError) {
          console.error("ERROR PROCESSING UPLOADED FILE:", uploadError);
        }
      } else if (req.body.profilePic && req.body.profilePic.startsWith('data:image')) {
        try {
          const uploadRes = await cloudinary.uploader.upload(req.body.profilePic, {
            folder: 'lms_images',
            transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
          });
          user.profilePic = uploadRes.secure_url;
          user.profileImage = {
            url: uploadRes.secure_url,
            publicId: uploadRes.public_id
          };
        } catch (base64Error) {
          console.error("BASE64 UPLOAD ERROR:", base64Error);
        }
      } else if (req.body.profilePic === '') {
        user.profilePic = '';
        user.profileImage = { url: '', publicId: '' };
      }

      // Role-Specific Academic Fields
      if (user.role === 'student') {
        user.batch = req.body.batch || user.batch;
        user.semester = req.body.semester ? Number(req.body.semester) : user.semester;
        user.rollNumber = req.body.rollNumber || user.rollNumber;
        user.year = req.body.year ? Number(req.body.year) : user.year;
      } else if (['teacher', 'hod', 'faculty'].includes(user.role)) {
        user.employeeId = req.body.employeeId || user.employeeId;
        if (req.body.expertise) {
           user.expertise = typeof req.body.expertise === 'string' 
             ? JSON.parse(req.body.expertise) 
             : req.body.expertise;
        }
      }

      // Parse JSON strings from FormData for complex fields
      if (req.body.emergencyContact) {
        try {
          user.emergencyContact = typeof req.body.emergencyContact === 'string' 
            ? JSON.parse(req.body.emergencyContact) 
            : req.body.emergencyContact;
        } catch (e) { console.error("EMERGENCY CONTACT PARSE ERROR:", e); }
      }

      if (req.body.parentInfo) {
        try {
          user.parentInfo = typeof req.body.parentInfo === 'string' 
            ? JSON.parse(req.body.parentInfo) 
            : req.body.parentInfo;
        } catch (e) { console.error("PARENT INFO PARSE ERROR:", e); }
      }

      // Handle Password Update if provided via a separate password change flow
      if (req.body.newPassword && req.body.newPassword.length >= 6) {
        user.password = req.body.newPassword;
      }

      if (req.body.deactivationRequested) {
        user.deactivationRequested = true;
      }

      try {
        const updatedUser = await user.save();
        console.log(`DATABASE PERSISTENCE SUCCESS: ${user.name}`);
        res.json(updatedUser);
      } catch (dbError) {
        console.error("TRY-CATCH CAUGHT MONGODB SAVE ERROR:", dbError);
        
        // Handle Duplicate Key Errors (e.g., enrollmentNumber already exists)
        if (dbError.code === 11000) {
          const field = Object.keys(dbError.keyPattern || {})[0] || 'field';
          return res.status(400).json({ 
            message: `Duplicate field error: The ${field} you provided is already in use by another account.`, 
            error: dbError.message 
          });
        }

        res.status(400).json({ 
          message: 'MongoDB failed to save the profile.', 
          error: dbError.message,
          details: dbError.errors 
        });
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("GLOBAL TRY-CATCH CAUGHT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot Password (Check Answer & Reset)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email, securityQuestion, securityAnswer, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.securityQuestion === securityQuestion && user.securityAnswer === securityAnswer) {
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(401).json({ message: 'Security answer incorrect' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register face descriptors
// @route   POST /api/auth/register-face
// @access  Private
export const registerFace = async (req, res) => {
  try {
    const { descriptors } = req.body; 
    const facultyId = req.user._id;

    if (!descriptors || descriptors.length < 5) {
      return res.status(400).json({ message: 'At least 5 face descriptors required' });
    }

    let facultyFace = await FacultyFace.findOne({ facultyId });
    if (facultyFace) {
      facultyFace.faceDescriptors = descriptors;
    } else {
      facultyFace = new FacultyFace({
        facultyId,
        faceDescriptors: descriptors,
      });
    }

    await facultyFace.save();
    res.status(200).json({ message: 'Face descriptors registered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login with face descriptor
// @route   POST /api/auth/login-face
// @access  Public
export const loginWithFace = async (req, res) => {
  try {
    const { email, descriptor } = req.body; 
    if (!email) return res.status(400).json({ message: 'Email is required for face login' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!['teacher', 'hod', 'admin'].includes(user.role)) {
       return res.status(401).json({ message: 'Face login only available for Admin, Faculty, and HOD' });
    }

    const facultyFace = await FacultyFace.findOne({ facultyId: user._id });
    if (!facultyFace || facultyFace.faceDescriptors.length === 0) {
      return res.status(404).json({ message: 'Face not registered for this account' });
    }

    // Euclidean distance matching
    const isMatch = facultyFace.faceDescriptors.some(stored => {
       const v1 = Array.from(stored.descriptor);
       const v2 = descriptor;
       
       if (v1.length !== v2.length) return false;
       
       const dist = Math.sqrt(v1.reduce((sum, val, i) => sum + Math.pow(val - v2[i], 2), 0));
       return dist < 0.55; // Slightly more balanced threshold (face-api generic is 0.6)
    });

    if (isMatch) {
      facultyFace.lastUsed = Date.now();
      await facultyFace.save();
      
      res.json({
        _id: user._id, name: user.name, email: user.email, role: user.role,
        department: user.department, profilePic: user.profilePic, token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Face not recognized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Update pulse (heartbeat)
// @route   POST /api/auth/pulse
// @access  Private
export const updatePulse = async (req, res) => {
  try {
    const { courseId } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      lastActive: Date.now(),
      currentCourse: courseId || null
    });
    res.status(200).json({ message: 'Pulse updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get counts of online students for a course
// @route   GET /api/auth/course-activity/:courseId
// @access  Public
export const getCourseActivity = async (req, res) => {
  try {
    const { courseId } = req.params;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const count = await User.countDocuments({
      currentCourse: courseId,
      lastActive: { $gte: fiveMinutesAgo }
    });
    res.json({ onlineCount: count || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get Global Student Leaderboard
// @route   GET /api/auth/leaderboard
// @access  Public
export const getLeaderboard = async (req, res) => {
  try {
    const { semester, limit = 500 } = req.query;
    const filter = { role: 'student', isActive: true };
    if (semester && semester !== 'All') filter.semester = Number(semester);

    const students = await User.find(filter)
      .select('name department semester profilePic _id enrollmentNumber')
      .lean();
    
    const studentIds = students.map(s => s._id);
    const [allProgress, allSubmissions] = await Promise.all([
      Progress.find({ user: { $in: studentIds } }).lean(),
      Submission.find({ student: { $in: studentIds }, status: 'graded' }).lean()
    ]);

    const leaderboard = students.map(student => {
      // XP from Resources (Progress)
      const studentProgressDocs = allProgress.filter(p => p.user.toString() === student._id.toString());
      const totalProgressXP = studentProgressDocs.reduce((sum, p) => sum + (p.completedItems?.length || 0), 0) * 10;
      
      // XP from Assignments (Submissions)
      const studentSubmissions = allSubmissions.filter(s => s.student.toString() === student._id.toString());
      const totalAssignmentXP = studentSubmissions.reduce((sum, s) => sum + (s.marksObtained || 0), 0);

      return {
        ...student,
        xp: totalProgressXP + totalAssignmentXP
      };
    });

    const sortedLeaderboard = leaderboard.sort((a, b) => b.xp - a.xp);
    
    // Return all or limited but enough for pagination
    res.json(sortedLeaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get student profile for teacher
// @route   GET /api/auth/student-profile/:studentId
// @access  Private (Teacher/HOD/Admin)
export const getStudentProfileByTeacher = async (req, res) => {
  try {
    if (!['teacher', 'hod', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Authorization Revoked: Permission denied' });
    }

    const { studentId } = req.params;
    const student = await User.findById(studentId).select('-password -securityAnswer -securityQuestion');
    if (!student) return res.status(404).json({ message: 'Student identity not found' });

    // Potential courses for this student's current sem/dept
    const allCourses = await Course.find().select('name code semester department excludedStudents');

    // Fetch Student Results (Graded Submissions)
    const results = await Submission.find({ 
      student: student._id, 
      status: 'graded' 
    }).populate({
      path: 'assignment',
      select: 'title type maxMarks',
      populate: { path: 'course', select: 'name code' }
    });

    res.json({ student, allCourses, results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance history (reused for teachers)
// @route   GET /api/auth/attendance/history
// @access  Private
export const getAttendanceHistory = async (req, res) => {
  try {
      const { userId, type } = req.query; // type: 'teacher' or 'student'
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const Attendance = (await import('../models/Attendance.js')).default;
      const TeacherAttendance = (await import('../models/TeacherAttendance.js')).default;

      if (type === 'teacher') {
          const history = await TeacherAttendance.find({
              teacher: userId,
              date: { $gte: startOfMonth }
          }).sort({ date: 1 });
          return res.json(history);
      } else {
          // Students: aggregated attendance from all courses
          const history = await Attendance.find({
              student: userId,
              date: { $gte: startOfMonth }
          }).populate('course', 'name code').sort({ date: 1 });
          return res.json(history);
      }
  } catch (e) {
      res.status(500).json({ message: e.message });
  }
};

// @desc    Get annual attendance report
// @route   GET /api/auth/attendance/annual-report
// @access  Private
export const getAnnualAttendanceReport = async (req, res) => {
  try {
      const { userId, type } = req.query;
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);

      const Attendance = (await import('../models/Attendance.js')).default;
      const TeacherAttendance = (await import('../models/TeacherAttendance.js')).default;

      let aggregateData;
      if (type === 'teacher') {
          aggregateData = await TeacherAttendance.aggregate([
              { $match: { 
                  teacher: new mongoose.Types.ObjectId(userId),
                  date: { $gte: startOfYear },
                  status: 'present'
              }},
              { $group: {
                  _id: { $month: "$date" },
                  count: { $sum: 1 }
              }}
          ]);
      } else {
          aggregateData = await Attendance.aggregate([
              { $match: { 
                  student: new mongoose.Types.ObjectId(userId),
                  date: { $gte: startOfYear },
                  status: 'present'
              }},
              { $group: {
                  _id: { $month: "$date" },
                  count: { $sum: 1 }
              }}
          ]);
      }

      // Fill monthly gaps
      const report = Array.from({ length: 12 }, (_, i) => {
          const monthData = aggregateData.find(d => d._id === i + 1);
          return {
              month: new Date(0, i).toLocaleString('default', { month: 'short' }),
              presentDays: monthData ? monthData.count : 0
          };
      });

      res.json(report);
  } catch (e) {
      res.status(500).json({ message: e.message });
  }
};

// @desc    Get next incremental roll number
// @route   GET /api/auth/next-roll-number?dept=X&batch=Y
// @access  Public
export const getNextRollNumber = async (req, res) => {
    try {
        const { dept, batch } = req.query;
        if (!dept) return res.status(400).json({ message: "Sector required." });

        const year = new Date().getFullYear().toString().slice(-2);
        const prefix = `${year}${dept.toUpperCase()}`;

        // Find users with roll number starting with this prefix
        const students = await User.find({
            role: 'student',
            rollNumber: { $regex: new RegExp(`^${prefix}`) }
        }).select('rollNumber').sort({ rollNumber: -1 }).limit(1);

        let sequence = 1;
        if (students.length > 0 && students[0].rollNumber) {
            const lastRoll = students[0].rollNumber;
            const lastPart = lastRoll.replace(prefix, '');
            const lastNum = parseInt(lastPart);
            if (!isNaN(lastNum)) sequence = lastNum + 1;
        }

        const nextRoll = `${prefix}${sequence.toString().padStart(3, '0')}`;
        res.json({ rollNumber: nextRoll });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
