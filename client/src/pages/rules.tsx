import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export default function Rules() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/");
    } else if (user.role !== "student") {
      // Admins and super admins don't need to see rules
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "superadmin") {
        navigate("/superadmin");
      }
    }
  }, [user, navigate]);

  const handleAcceptRules = () => {
    navigate("/waiting-room");
  };

  if (!user) return null;

  return (
    <motion.div 
      className="min-h-screen flex flex-col p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white shadow-lg rounded-xl p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">Rules and Regulations</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-primary-700 mb-2">Competition Format</h2>
              <ul className="list-disc pl-5 text-gray-700 space-y-2">
                <li>The competition consists of 50 multiple-choice mathematics questions.</li>
                <li>Each question must be answered within 1 minute. The timer starts when the question appears.</li>
                <li>Questions will automatically advance when the timer expires.</li>
                <li>Once a question is answered or skipped, you cannot go back.</li>
              </ul>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-primary-700 mb-2">Scoring System</h2>
              <ul className="list-disc pl-5 text-gray-700 space-y-2">
                <li>Correct answer: +2 points</li>
                <li>Incorrect answer: -1 point</li>
                <li>Unanswered question: 0 points</li>
                <li>Final leaderboard placement is based on total points earned.</li>
              </ul>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-primary-700 mb-2">Technical Requirements</h2>
              <ul className="list-disc pl-5 text-gray-700 space-y-2">
                <li>Stable internet connection is required throughout the competition.</li>
                <li>Do not refresh the page or navigate away during the quiz.</li>
                <li>Use of calculators, textbooks, or external help is strictly prohibited.</li>
              </ul>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-primary-700 mb-2">Code of Conduct</h2>
              <ul className="list-disc pl-5 text-gray-700 space-y-2">
                <li>Participants must complete the quiz independently.</li>
                <li>Any form of cheating will result in immediate disqualification.</li>
                <li>The administrator's decision regarding results is final.</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={handleAcceptRules}>
              I Accept
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
