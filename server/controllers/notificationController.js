import Notification from '../models/Notification.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Department from '../models/Department.js';

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name profilePic')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    if (notification.recipient.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const dismissPopup = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification || notification.recipient.toString() !== req.user._id.toString()) return res.status(404).send();
    notification.popupActive = false;
    await notification.save();
    res.json(notification);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const triggerLiveClassNotification = async (req, res) => {
  try {
    const { courseId } = req.body;
    const senderId = req.user._id;

    // 1. Fetch course details to get semester and department
    const course = await Course.findById(courseId).populate('department');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // 2. Identify target students (same semester and department)
    const targetStudents = await User.find({
      role: 'student',
      semester: course.semester,
      $or: [
        { department: course.department.name },
        { department: course.department.code }
      ]
    }).select('_id');

    if (targetStudents.length === 0) {
      return res.json({ message: 'No students found in this sector to notify.' });
    }

    // 3. Create bulk notifications
    const notificationData = targetStudents.map(student => ({
      recipient: student._id,
      sender: senderId,
      title: 'LIVE SESSION ALERT',
      message: `Professor ${req.user.name} has initiated a live class for ${course.name} (${course.code}). Synchronize immediately.`,
      type: 'success',
      link: `/live-class/${courseId}`,
      popupActive: true
    }));

    const createdNotifications = await Notification.insertMany(notificationData);

    // 4. Emit socket events if io is available
    if (req.io) {
      targetStudents.forEach(student => {
        req.io.to(`user_${student._id}`).emit('new-notification', {
           title: 'LIVE SESSION ALERT',
           message: `Live class started for ${course.code}`,
           type: 'success',
           link: `/live-class/${courseId}`
        });
      });
    }

    res.json({ message: `Successfully synchronized ${targetStudents.length} student terminals.` });
  } catch (error) {
    res.status(500).json({ message: 'Deployment Failure', error: error.message });
  }
};
