import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuizArena from '../../components/student/QuizArena';
import { useSelector } from 'react-redux';
import axios from 'axios';

const QuizArenaPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <QuizArena 
          quizId={quizId} 
          onClose={() => navigate('/dashboard?tab=quizzes')} 
        />
      </div>
    </div>
  );
};

export default QuizArenaPage;
