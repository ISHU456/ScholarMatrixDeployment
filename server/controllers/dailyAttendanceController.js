import DailyAttendance from '../models/DailyAttendance.js';
import GPSConfig from '../models/GPSConfig.js';
import UserFace from '../models/UserFace.js';
import { decryptDescriptors } from '../utils/crypto.js';
import { getDistance } from '../utils/haversine.js';

// @desc    Mark daily entry attendance
// @route   POST /api/attendance/daily/entry
// @access  Student
export const markDailyEntry = async (req, res) => {
  try {
    const { descriptor, location } = req.body;
    const userId = req.user._id;

    if (!descriptor || !location) {
      return res.status(400).json({ message: 'Missing face descriptor or location data' });
    }

    // 1. Fetch GPS/Window Config
    const gpsConfig = await GPSConfig.findOne({ isActive: true });
    if (!gpsConfig) {
        return res.status(500).json({ message: 'Attendance configuration not found' });
    }

    // 2. Check Entry Window
    const now = new Date();
    const currentTimeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    if (currentTimeStr < gpsConfig.entryStartTime || currentTimeStr > gpsConfig.entryEndTime) {
      return res.status(403).json({ 
        message: `Entry window is only active between ${gpsConfig.entryStartTime} and ${gpsConfig.entryEndTime}` 
      });
    }

    // 2. Fetch Face Data & Verify
    const userFace = await UserFace.findOne({ user: userId });
    if (!userFace) return res.status(404).json({ message: 'Face not registered' });

    const storedDescriptors = decryptDescriptors(userFace.encryptedDescriptors);
    const isMatch = storedDescriptors.some(stored => {
       const v1 = Array.from(stored);
       const v2 = Array.from(descriptor);
       if (v1.length !== v2.length) return false;
       const dist = Math.sqrt(v1.reduce((sum, val, i) => sum + Math.pow(val - v2[i], 2), 0));
       return dist < 0.5;
    });

    if (!isMatch) return res.status(401).json({ message: 'Face verification failed' });

    // 4. GPS Verification
    if (gpsConfig.center && gpsConfig.center.lat) {
      const distance = getDistance(location.latitude, location.longitude, gpsConfig.center.lat, gpsConfig.center.lng);
      if (distance > gpsConfig.radius) {
         return res.status(401).json({ 
           message: `You are outside the campus perimeter (${Math.round(distance)}m away). Allowed radius: ${gpsConfig.radius}m` 
         });
      }
    }

    // 4. Record Entry
    // Use IST timezone for date calculation to avoid UTC offset issues (Render servers are often in UTC)
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const today = new Date(Date.UTC(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate()));

    let attendance = await DailyAttendance.findOne({ student: userId, date: today });

    if (attendance && attendance.entry && attendance.entry.time) {
      return res.status(400).json({ message: 'Entry already marked for today' });
    }

    if (!attendance) {
      attendance = new DailyAttendance({
        student: userId,
        date: today,
        entry: {
          time: new Date(),
          location: { lat: location.latitude, lng: location.longitude },
          faceVerified: true
        },
        status: 'incomplete'
      });
    } else {
      attendance.entry = {
          time: new Date(),
          location: { lat: location.latitude, lng: location.longitude },
          faceVerified: true
      };
    }

    await attendance.save();

    res.status(201).json({ message: 'Daily Entry marked successfully', attendance });

  } catch (error) {
    console.error('Error marking daily entry:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark daily exit attendance
// @route   POST /api/attendance/daily/exit
// @access  Student
export const markDailyExit = async (req, res) => {
  try {
    const { descriptor, location } = req.body;
    const userId = req.user._id;

    if (!descriptor || !location) {
      return res.status(400).json({ message: 'Missing face descriptor or location data' });
    }

    // 1. Fetch Config
    const gpsConfig = await GPSConfig.findOne({ isActive: true });
    if (!gpsConfig) {
        return res.status(500).json({ message: 'Attendance configuration not found' });
    }

    // 2. Check Exit Window
    const now = new Date();
    const currentTimeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    if (currentTimeStr < gpsConfig.exitStartTime || currentTimeStr > gpsConfig.exitEndTime) {
      return res.status(403).json({ 
        message: `Exit window is only active between ${gpsConfig.exitStartTime} and ${gpsConfig.exitEndTime}` 
      });
    }

    // 2. Face & GPS (Same as entry)
    const userFace = await UserFace.findOne({ user: userId });
    if (!userFace) return res.status(404).json({ message: 'Face not registered' });

    const storedDescriptors = decryptDescriptors(userFace.encryptedDescriptors);
    const isMatch = storedDescriptors.some(stored => {
       const v1 = Array.from(stored);
       const v2 = Array.from(descriptor);
       const dist = Math.sqrt(v1.reduce((sum, val, i) => sum + Math.pow(val - v2[i], 2), 0));
       return dist < 0.5;
    });

    if (!isMatch) return res.status(401).json({ message: 'Face verification failed' });

    // 4. GPS Verification (Same as entry)
    if (gpsConfig.center && gpsConfig.center.lat) {
      const distance = getDistance(location.latitude, location.longitude, gpsConfig.center.lat, gpsConfig.center.lng);
      if (distance > gpsConfig.radius) {
         return res.status(401).json({ message: `Outside campus perimeter (${Math.round(distance)}m away)` });
      }
    }

    // 3. Record Exit
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const today = new Date(Date.UTC(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate()));

    let attendance = await DailyAttendance.findOne({ student: userId, date: today });

    if (!attendance || !attendance.entry || !attendance.entry.time) {
      return res.status(400).json({ message: 'You must mark Entry before marking Exit' });
    }

    if (attendance.exit && attendance.exit.time) {
      return res.status(400).json({ message: 'Exit already marked for today' });
    }

    attendance.exit = {
      time: new Date(),
      location: { lat: location.latitude, lng: location.longitude },
      faceVerified: true
    };
    attendance.status = 'present'; // Both entry and exit done

    await attendance.save();

    res.status(200).json({ message: 'Daily Exit marked successfully', attendance });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current student's daily status
// @route   GET /api/attendance/daily/status
export const getDailyStatus = async (req, res) => {
  try {
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const today = new Date(Date.UTC(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate()));
    
    const attendance = await DailyAttendance.findOne({ 
      student: req.user._id, 
      date: today 
    });

    const gpsConfig = await GPSConfig.findOne({ isActive: true });

    res.json({ attendance, gpsConfig });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Update GPS Configuration
// @route   POST /api/attendance/daily/gps-config
export const updateGPSConfig = async (req, res) => {
  try {
    const { lat, lng, radius, label, entryStartTime, entryEndTime, exitStartTime, exitEndTime } = req.body;

    let config = await GPSConfig.findOne({ isActive: true });
    if (config) {
      config.center = { lat, lng };
      config.radius = radius;
      config.label = label || config.label;
      config.entryStartTime = entryStartTime || config.entryStartTime;
      config.entryEndTime = entryEndTime || config.entryEndTime;
      config.exitStartTime = exitStartTime || config.exitStartTime;
      config.exitEndTime = exitEndTime || config.exitEndTime;
      config.updatedBy = req.user._id;
    } else {
      config = new GPSConfig({
        center: { lat, lng },
        radius,
        label,
        entryStartTime,
        entryEndTime,
        exitStartTime,
        exitEndTime,
        updatedBy: req.user._id
      });
    }

    await config.save();
    res.json({ message: 'GPS Configuration updated', config });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get students monthly daily attendance (for Teachers)
export const getMonthlyDailyAttendance = async (req, res) => {
  try {
    const { studentId, month, year } = req.query;
    
    const targetMonth = Number(month) || new Date().getMonth() + 1;
    const targetYear = Number(year) || new Date().getFullYear();

    const start = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
    const end = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

    const records = await DailyAttendance.find({
      student: studentId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get bulk monthly daily attendance for a list of students
export const getBulkMonthlyDailyAttendance = async (req, res) => {
  try {
    const { studentIds, month, year } = req.query;
    if (!studentIds) return res.status(400).json({ message: 'studentIds required' });
    
    const ids = studentIds.split(',');
    const targetMonth = Number(month) || new Date().getMonth() + 1;
    const targetYear = Number(year) || new Date().getFullYear();

    const start = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
    const end = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

    const records = await DailyAttendance.find({
      student: { $in: ids },
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
