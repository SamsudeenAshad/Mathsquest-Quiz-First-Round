import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Question, QuizSetting, QuizAnswer, Result } from '@shared/schema';
import { useAuth } from './AuthContext';

interface QuizContextType {
  quizState: 'waiting' | 'started' | 'completed';
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Map<number, string | null>;
  timeRemaining: number;
  startQuiz: () => Promise<void>;
  resetQuiz: () => Promise<void>;
  submitAnswer: (questionId: number, answer: string | null) => Promise<void>;
  nextQuestion: () => void;
  submitQuiz: () => Promise<void>;
  loading: boolean;
  error: string | null;
  score: number | null;
  quizResult: Result | null;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  const [quizState, setQuizState] = useState<'waiting' | 'started' | 'completed'>('waiting');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<number, string | null>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds per question
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<Result | null>(null);
  
  // Fetch quiz settings
  const { data: quizSettings, isLoading: loadingSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['/api/quiz/settings'],
    refetchInterval: 5000, // Poll every 5 seconds to check if quiz has started
    onSuccess: (data) => {
      setQuizState(data.state);
      
      // If quiz is started and user is in waiting room, redirect to quiz
      if (data.state === 'started' && location === '/waiting-room') {
        navigate('/quiz');
      }
    }
  });
  
  // Fetch questions
  const { data: questionsData, isLoading: loadingQuestions } = useQuery({
    queryKey: ['/api/questions'],
    enabled: quizState === 'started',
    onSuccess: (data) => {
      setQuestions(data);
    }
  });
  
  // Fetch user quiz answers (for resuming a quiz)
  const { data: userAnswersData, isLoading: loadingAnswers } = useQuery({
    queryKey: ['/api/quiz/answers'],
    enabled: quizState === 'started' && !!user,
    onSuccess: (data: QuizAnswer[]) => {
      const answersMap = new Map<number, string | null>();
      data.forEach(answer => {
        answersMap.set(answer.questionId, answer.userAnswer);
      });
      setUserAnswers(answersMap);
      
      // Set current question index based on answered questions
      if (data.length > 0 && data.length < questions.length) {
        setCurrentQuestionIndex(data.length);
      }
    }
  });
  
  // Fetch user results
  const { data: resultData, isLoading: loadingResult } = useQuery({
    queryKey: ['/api/results/me'],
    enabled: !!user,
    onSuccess: (data) => {
      if (data) {
        setQuizResult(data);
        setScore(data.score);
      }
    }
  });
  
  // Start quiz mutation (admin only)
  const startQuizMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/quiz/start', {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz started",
        description: "The quiz has been started for all students.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quiz/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to start quiz",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Reset quiz mutation (superadmin only)
  const resetQuizMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/quiz/reset', {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz reset",
        description: "The quiz and leaderboard have been reset.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quiz/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/results'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reset quiz",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number, answer: string | null }) => {
      if (!user) throw new Error("User not authenticated");
      
      const res = await apiRequest('POST', '/api/quiz/answers', {
        userId: user.id,
        questionId,
        userAnswer: answer,
        responseTimeSeconds: 60 - timeRemaining
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz/answers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit answer",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Submit quiz results mutation
  const submitResultsMutation = useMutation({
    mutationFn: async (resultData: {
      score: number;
      correctAnswers: number;
      incorrectAnswers: number;
      skippedAnswers: number;
      averageResponseTime: number;
      completionTime: number;
    }) => {
      if (!user) throw new Error("User not authenticated");
      
      const res = await apiRequest('POST', '/api/results', {
        userId: user.id,
        ...resultData
      });
      return res.json();
    },
    onSuccess: (data) => {
      setQuizResult(data);
      setScore(data.score);
      navigate('/leaderboard');
      toast({
        title: "Quiz completed",
        description: "Your results have been submitted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/results'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit results",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Timer effect for current question
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (quizState === 'started' && questions.length > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          // If time runs out, automatically submit the current answer and move to next question
          if (prev <= 1) {
            const currentQuestion = questions[currentQuestionIndex];
            if (currentQuestion) {
              // Get current answer (might be null if unanswered)
              const answer = userAnswers.get(currentQuestion.id) || null;
              submitAnswer(currentQuestion.id, answer);
            }
            
            // Move to next question or end quiz
            if (currentQuestionIndex < questions.length - 1) {
              setCurrentQuestionIndex(prev => prev + 1);
              return 60; // Reset timer for next question
            } else {
              // End of quiz
              submitQuiz();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    // Reset timer when changing questions manually
    if (quizState === 'started' && questions.length > 0) {
      setTimeRemaining(60);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quizState, currentQuestionIndex, questions.length]);
  
  // Submit answer function
  const submitAnswer = async (questionId: number, answer: string | null) => {
    try {
      // Update local state first for immediate feedback
      const newAnswers = new Map(userAnswers);
      newAnswers.set(questionId, answer);
      setUserAnswers(newAnswers);
      
      // Submit to server
      await submitAnswerMutation.mutateAsync({ questionId, answer });
      
      return true;
    } catch (error) {
      return false;
    }
  };
  
  // Next question function
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeRemaining(60); // Reset timer
    } else {
      // End of quiz
      submitQuiz();
    }
  };
  
  // Start quiz function (admin only)
  const startQuiz = async () => {
    try {
      await startQuizMutation.mutateAsync();
      return true;
    } catch (error) {
      return false;
    }
  };
  
  // Reset quiz function (superadmin only)
  const resetQuiz = async () => {
    try {
      await resetQuizMutation.mutateAsync();
      return true;
    } catch (error) {
      return false;
    }
  };
  
  // Calculate and submit final results
  const submitQuiz = async () => {
    if (!user || questions.length === 0) return;
    
    // Calculate results
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    let totalResponseTime = 0;
    
    questions.forEach(question => {
      const answer = userAnswers.get(question.id);
      if (answer === undefined || answer === null) {
        skippedCount++;
      } else if (answer === question.correctAnswer) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });
    
    // Calculate score: +2 for correct, -1 for incorrect, 0 for skipped
    const finalScore = (correctCount * 2) - incorrectCount;
    
    // Calculate average response time
    const answeredCount = correctCount + incorrectCount;
    const averageTime = answeredCount > 0 ? totalResponseTime / answeredCount : 0;
    
    // Submit results
    await submitResultsMutation.mutateAsync({
      score: finalScore,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      skippedAnswers: skippedCount,
      averageResponseTime: Math.round(averageTime),
      completionTime: questions.length * 60 - timeRemaining // Approximate completion time
    });
  };
  
  // Provide quiz context
  const value = {
    quizState,
    questions,
    currentQuestionIndex,
    userAnswers,
    timeRemaining,
    startQuiz,
    resetQuiz,
    submitAnswer,
    nextQuestion,
    submitQuiz,
    loading: loadingSettings || loadingQuestions || loadingAnswers || loadingResult || 
             startQuizMutation.isPending || resetQuizMutation.isPending || 
             submitAnswerMutation.isPending || submitResultsMutation.isPending,
    error,
    score,
    quizResult
  };
  
  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

// Hook for using quiz context
export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
}
