import User from '../models/User.js';
import Badge from '../models/Badge.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';

// --- LOGIC: CALCULATE COINS ---
const calculateQuizCoins = async (quiz, score, timeTaken, maxScore) => {
    let coins = quiz.coinsReward?.base || 10;
    
    // 1. Accuracy Bonus
    const percentage = (score / maxScore) * 100;
    if (percentage === 100) coins += quiz.coinsReward?.fullMarksBonus || 20;
    else if (percentage >= 90) coins += 10;

    // 2. Speed Bonus
    if (quiz.idealTime && timeTaken <= quiz.idealTime) {
        coins = Math.round(coins * (quiz.coinsReward?.speedBonusMultiplier || 1.5));
    }

    // 3. Ranking Bonus (Logic: Fetch last attempts to determine rank)
    // For simplicity, we compare with current session attempts or global
    const previousAttempts = await QuizAttempt.countDocuments({ quiz: quiz._id });
    const rank = previousAttempts + 1;

    if (rank === 1) coins += 100;
    else if (rank === 2) coins += 75;
    else if (rank === 3) coins += 50;
    else if (rank <= 10) coins += 25;

    return { coins, rank };
};

// --- CONTROLLERS ---

export const submitQuiz = async (req, res) => {
    try {
        const { quizId, score, timeTaken, answers, tabSwitches } = req.body;
        const userId = req.user._id;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        // 1. LIMIT: Check if user already attempted this quiz (Bypass for admins)
        const existingAttempt = await QuizAttempt.findOne({ user: userId, quiz: quizId });
        if (existingAttempt && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access Denied: You have already participated in this arena." });
        }

        // Anti-cheat: Check if time taken is suspiciously low (e.g. < 5s for 10 questions)
        if (timeTaken < (quiz.questions.length * 0.5)) {
            return res.status(403).json({ message: "Abnormal speed detected. Submission flagged." });
        }

        // Use the coins exactly as set by admin (totalPoints)
        const coins = quiz.totalPoints || 10;
        const rank = (await QuizAttempt.countDocuments({ quiz: quizId })) + 1;

        const attempt = new QuizAttempt({
            user: userId,
            quiz: quizId,
            score,
            maxScore: quiz.totalPoints,
            timeTaken,
            coinsEarned: coins,
            answers,
            rank,
            tabSwitches
        });

        await attempt.save();

        // Update User Profile
        const user = await User.findById(userId);
        user.coins += coins;
        
        // Streak Logic: If lastStreakedAt was yesterday, increment. If today, stay. Else reset.
        const today = new Date().setHours(0,0,0,0);
        const lastStreakDate = user.lastStreakedAt ? new Date(user.lastStreakedAt).setHours(0,0,0,0) : null;
        const yesterday = new Date(Date.now() - 86400000).setHours(0,0,0,0);

        if (lastStreakDate === yesterday) {
            user.streak += 1;
            user.lastStreakedAt = new Date();
        } else if (!lastStreakDate || lastStreakDate < yesterday) {
            user.streak = 1;
            user.lastStreakedAt = new Date();
        }

        await user.save();

        // CHECK FOR BADGE UNLOCKS
        const badges = await Badge.find({ 'criteria.type': 'QuizCount' });
        const userQuizCount = await QuizAttempt.countDocuments({ user: userId });
        
        const newBadges = [];
        for (const badge of badges) {
            const alreadyEarned = user.earnedBadges.some(b => b.badge.toString() === badge._id.toString());
            if (!alreadyEarned && userQuizCount >= badge.criteria.threshold) {
                user.earnedBadges.push({ badge: badge._id });
                newBadges.push(badge);
            }
        }
        if (newBadges.length > 0) await user.save();

        res.json({
            message: "Quiz processed successfully.",
            coinsEarned: coins,
            rank,
            score,
            maxScore: quiz.totalPoints,
            newBadges,
            totalCoins: user.coins,
            streak: user.streak
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLeaderboard = async (req, res) => {
    try {
        const { type, filter } = req.query; // type: daily, weekly, monthly, global | filter: CSE, IT, etc.
        
        let matchStage = {};
        const now = new Date();
        if (type === 'daily') matchStage.createdAt = { $gte: new Date(now.setHours(0,0,0,0)) };
        else if (type === 'weekly') matchStage.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
        
        const leaderboard = await User.find(matchStage)
            .select('name profilePic coins department streak')
            .sort({ coins: -1 })
            .limit(20);

        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyAchievements = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('earnedBadges.badge');
        const allBadges = await Badge.find();
        
        res.json({
            earned: user.earnedBadges,
            all: allBadges,
            stats: {
                coins: user.coins,
                streak: user.streak,
                learningTime: user.totalLearningTime
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createBadge = async (req, res) => {
    try {
        const badge = new Badge(req.body);
        await badge.save();
        res.status(201).json(badge);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createQuiz = async (req, res) => {
    try {
        const quiz = new Quiz({
            ...req.body,
            createdBy: req.user._id
        });
        await quiz.save();
        res.status(201).json(quiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getQuizzes = async (req, res) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { isActive: true };
        const quizzes = await Quiz.find(filter).select('title description category timeLimit totalPoints isActive');
        const attempts = await QuizAttempt.find({ user: req.user._id }).select('quiz');
        const attemptedQuizIds = attempts.map(a => a.quiz.toString());

        const quizzesWithStatus = quizzes.map(quiz => ({
            ...quiz._doc,
            isAttempted: attemptedQuizIds.includes(quiz._id.toString())
        }));

        res.json(quizzesWithStatus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getQuizDetails = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findByIdAndUpdate(id, req.body, { new: true });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findByIdAndDelete(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Exported for daily activity tracking
export const markDailyStreak = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const today = new Date().setHours(0,0,0,0);
        const lastStreakDate = user.lastStreakedAt ? new Date(user.lastStreakedAt).setHours(0,0,0,0) : null;
        const yesterday = new Date(Date.now() - 86400000).setHours(0,0,0,0);

        if (lastStreakDate === today) {
            return res.json({ message: "Already streaked today", streak: user.streak });
        }

        if (lastStreakDate === yesterday) {
            user.streak += 1;
        } else {
            user.streak = 1;
        }
        user.lastStreakedAt = new Date();
        // Award some coins for daily streak
        user.coins += 10;
        
        await user.save();

        res.json({
            message: "Streak marked! +10 Scholar Coins awarded.",
            streak: user.streak,
            totalCoins: user.coins
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getQuizAttendees = async (req, res) => {
    try {
        const { quizId } = req.params;
        const attempts = await QuizAttempt.find({ quiz: quizId })
            .populate('user', 'name email rollNumber department semester profilePic')
            .sort({ score: -1, timeTaken: 1 });
        res.json(attempts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const resetQuizAttempt = async (req, res) => {
    try {
        const { quizId, userId } = req.params;
        
        // Only admins can reset attempts
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized: Admin access required." });
        }

        const result = await QuizAttempt.findOneAndDelete({ quiz: quizId, user: userId });
        
        if (!result) {
            return res.status(404).json({ message: "Attempt record not found." });
        }

        res.json({ message: "Quiz attempt reset successfully. Student may re-participate." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const resetAllQuizAttempts = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized: Admin access required." });
        }

        const result = await QuizAttempt.deleteMany({ quiz: id });
        console.log(`Admin ${req.user.email} reset all attempts for quiz ${id}. Deleted: ${result.deletedCount}`);
        res.json({ message: `All quiz attempts have been reset. Deleted ${result.deletedCount} records.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleQuizStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized: Admin access required." });
        }

        const quiz = await Quiz.findById(id);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        quiz.isActive = !quiz.isActive;
        await quiz.save();

        console.log(`Admin ${req.user.email} toggled quiz ${id} to ${quiz.isActive ? 'Active' : 'Inactive'}`);
        res.json({ message: `Quiz status updated to ${quiz.isActive ? 'Active' : 'Inactive'}`, isActive: quiz.isActive });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
