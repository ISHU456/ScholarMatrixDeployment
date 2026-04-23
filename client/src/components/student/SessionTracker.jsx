import { useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useGamification } from '../../hooks/useGamification';
import { getTodayKey } from '../../utils/gamificationStore';
import axios from 'axios';
import { updateProfile } from '../../features/auth/authSlice';
import { setSessionSeconds, incrementSessionSeconds } from '../../features/gamification/gamificationSlice';

const SessionTracker = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { sessionSeconds } = useSelector((state) => state.gamification);
  const studentId = user?._id;
  const { gamification, markAttendance } = useGamification(studentId);

  const todayKey = useMemo(() => getTodayKey(), []);
  const storageKey = useMemo(() => `scholar_session_seconds_${studentId}_${todayKey}`, [studentId, todayKey]);

  // Initial load from localStorage into Redux
  useEffect(() => {
    if (studentId) {
      // Priority 1: Check if already attended today via gamification store
      const hasAttendedToday = gamification?.attendanceDates?.includes(todayKey);
      
      if (hasAttendedToday) {
         dispatch(setSessionSeconds(300));
      } else {
         // Priority 2: Load from localStorage
         const saved = localStorage.getItem(storageKey);
         if (saved) {
           dispatch(setSessionSeconds(Math.min(300, Number(saved))));
         }
      }
    }
  }, [studentId, storageKey, dispatch, gamification?.attendanceDates, todayKey]);

  // Persist Redux state to localStorage
  useEffect(() => {
    if (studentId) {
      localStorage.setItem(storageKey, sessionSeconds);
    }
  }, [sessionSeconds, storageKey, studentId]);

  // Global Timer: Increments Redux state
  useEffect(() => {
    if (!studentId || user?.role !== 'student' || sessionSeconds >= 300) return;

    const interval = setInterval(() => {
      dispatch(incrementSessionSeconds());
    }, 1000);

    return () => clearInterval(interval);
  }, [studentId, user?.role, sessionSeconds, dispatch]);

  const syncStreakToBackend = useCallback(async () => {
    const alreadyAttended = gamification?.attendanceDates?.includes(todayKey);
    if (!studentId || !user?.token || sessionSeconds < 300 || alreadyAttended) return;
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      // 1. Mark streak in DB
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/gamification/mark-streak`, {}, config);
      
      // 2. Mark attendance in local store
      markAttendance({ dateKey: todayKey });
      
      // 3. Refresh profile to get updated coins/streak
      const profileRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/profile`, config);
      if (profileRes.data) {
        dispatch(updateProfile(profileRes.data));
      }
      
      console.log("Global Session Tracker: Performance metrics synced with Neural Grid.");
    } catch (err) {
      console.error("Streak sync failure:", err.response?.data?.message || err.message);
    }
  }, [studentId, user?.token, sessionSeconds, markAttendance, todayKey, dispatch]);

  // Streak Marking Trigger
  useEffect(() => {
    if (sessionSeconds >= 300) {
      syncStreakToBackend();
    }
  }, [sessionSeconds, syncStreakToBackend]);

  return null;
};

export default SessionTracker;
