import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useQuiz } from "@/context/QuizContext";
import { useQuery } from "@tanstack/react-query";
import { Result, User } from "@shared/schema";
import { motion } from "framer-motion";
import { ArrowLeft, FileDown, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Leaderboard() {
  const { user } = useAuth();
  const { quizResult } = useQuiz();
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch all results for the leaderboard
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['/api/results'],
    enabled: !!user,
  });

  // Get user data for the leaderboard
  const { data: usersData } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user && (user.role === 'admin' || user.role === 'superadmin'),
  });

  const handleBack = () => {
    if (user?.role === 'admin') {
      navigate("/admin");
    } else if (user?.role === 'superadmin') {
      navigate("/superadmin");
    } else {
      navigate("/quiz");
    }
  };

  const handleDownloadCertificate = () => {
    toast({
      title: "Certificate download",
      description: "Your certificate is being generated and will download shortly.",
    });
  };

  const handleShareResults = () => {
    toast({
      title: "Share results",
      description: "Sharing feature is coming soon!",
    });
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary-600 font-semibold">
          Loading results...
        </div>
      </div>
    );
  }

  // Get current user result
  const userResult = quizResult || (leaderboardData && leaderboardData.find((r: Result) => r.userId === user.id));

  // Sort results by score (highest first)
  const sortedResults = leaderboardData ? [...leaderboardData].sort((a: Result, b: Result) => b.score - a.score) : [];

  // Calculate user rank if not already set
  const userRank = userResult?.rank || sortedResults.findIndex((r: Result) => r.userId === user.id) + 1;

  // Get username from usersData if available (for admins), otherwise just show "Student"
  const getUsernameById = (userId: number) => {
    if (!usersData) return "Student";
    const foundUser = usersData.find((u: User) => u.id === userId);
    return foundUser ? foundUser.username : "Student";
  };

  const getSchoolById = (userId: number) => {
    if (!usersData) return "School";
    const foundUser = usersData.find((u: User) => u.id === userId);
    return foundUser ? foundUser.school || "—" : "—";
  };

  // Format time in minutes:seconds
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center text-primary-600 hover:text-primary-800"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </Button>
      </div>
      
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Results</h1>
          <p className="text-gray-600">Congratulations on completing the NSBM MathsMaster Quiz!</p>
        </div>
        
        {userResult && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-xl font-bold text-gray-800 mb-1">Your Score</h2>
                  <p className="text-gray-600">Well done, <span className="font-semibold">{user.username}</span>!</p>
                </div>
                
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm">Score</p>
                    <p className="text-3xl font-bold text-primary-600">{userResult.score}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-gray-600 text-sm">Rank</p>
                    <p className="text-3xl font-bold text-primary-600">{userRank}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-gray-600 text-sm">Time</p>
                    <p className="text-3xl font-bold text-primary-600">
                      {userResult.completionTime ? formatTime(userResult.completionTime) : '--:--'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Button 
                  className="flex items-center justify-center"
                  onClick={handleDownloadCertificate}
                >
                  <FileDown className="h-5 w-5 mr-2" />
                  Download Certificate
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center"
                  onClick={handleShareResults}
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  Share Results
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Performance Stats */}
        {userResult && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Accuracy</h3>
                <div className="flex justify-center mb-4">
                  <div className="relative h-32 w-32">
                    <svg className="h-full w-full" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1E88E5" strokeWidth="3" strokeDasharray={`${userResult.correctAnswers / (userResult.correctAnswers + userResult.incorrectAnswers) * 100}, 100`} />
                      <text x="18" y="20.5" textAnchor="middle" className="text-3xl font-bold" fill="#1E88E5">
                        {Math.round(userResult.correctAnswers / (userResult.correctAnswers + userResult.incorrectAnswers) * 100)}%
                      </text>
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">
                    {userResult.correctAnswers} correct out of {userResult.correctAnswers + userResult.incorrectAnswers + userResult.skippedAnswers} questions
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Response Time</h3>
                <div className="h-40 relative flex items-end justify-center">
                  <div className="h-full flex items-end space-x-2">
                    <div className="w-10 h-1/5 bg-primary-200"></div>
                    <div className="w-10 h-2/5 bg-primary-300"></div>
                    <div className="w-10 h-3/5 bg-primary-400"></div>
                    <div className="w-10 h-4/5 bg-primary-500"></div>
                    <div className="w-10 h-3/5 bg-primary-400"></div>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <p className="text-gray-600 text-sm">
                    Average: {userResult.averageResponseTime} seconds per question
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Question Breakdown</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Correct</span>
                      <span className="text-sm font-medium text-gray-700">{userResult.correctAnswers}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${userResult.correctAnswers / (userResult.correctAnswers + userResult.incorrectAnswers + userResult.skippedAnswers) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Incorrect</span>
                      <span className="text-sm font-medium text-gray-700">{userResult.incorrectAnswers}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${userResult.incorrectAnswers / (userResult.correctAnswers + userResult.incorrectAnswers + userResult.skippedAnswers) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Skipped</span>
                      <span className="text-sm font-medium text-gray-700">{userResult.skippedAnswers}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${userResult.skippedAnswers / (userResult.correctAnswers + userResult.incorrectAnswers + userResult.skippedAnswers) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Leaderboard */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Leaderboard</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedResults.slice(0, 10).map((result: Result, index: number) => {
                    // Highlight different ranks
                    let rowClass = "";
                    if (index === 0) rowClass = "bg-yellow-50";
                    else if (index === 1) rowClass = "bg-gray-50";
                    else if (index === 2) rowClass = "bg-primary-50";
                    
                    // Highlight current user
                    if (result.userId === user.id) {
                      rowClass = "bg-primary-50";
                    }
                    
                    return (
                      <tr key={result.id} className={rowClass}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`flex-shrink-0 h-8 w-8 rounded-full ${
                              index === 0 ? "bg-yellow-500" :
                              index === 1 ? "bg-gray-400" :
                              index === 2 ? "bg-primary-500" : "bg-gray-300"
                            } flex items-center justify-center text-white font-bold`}>
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.role === 'admin' || user.role === 'superadmin' 
                              ? getUsernameById(result.userId) 
                              : result.userId === user.id ? user.username : `Student ${index + 1}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {user.role === 'admin' || user.role === 'superadmin' 
                              ? getSchoolById(result.userId) 
                              : result.userId === user.id ? user.school : "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{result.score}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {result.completionTime ? formatTime(result.completionTime) : '--:--'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
