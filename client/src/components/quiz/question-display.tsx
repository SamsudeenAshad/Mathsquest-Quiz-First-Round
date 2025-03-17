import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Question } from "@/lib/quiz";

interface QuestionDisplayProps {
  question: Question;
  onSubmit: (answer: "A" | "B" | "C" | "D") => void;
  onNext: () => void;
  currentIndex: number;
  totalQuestions: number;
  disabled?: boolean;
}

export default function QuestionDisplay({
  question,
  onSubmit,
  onNext,
  currentIndex,
  totalQuestions,
  disabled
}: QuestionDisplayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<"A" | "B" | "C" | "D" | null>(null);
  
  const handleSubmit = () => {
    if (selectedAnswer) {
      onSubmit(selectedAnswer);
      setSelectedAnswer(null);
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">{question.text}</h2>
      
      <RadioGroup
        value={selectedAnswer || ""}
        onValueChange={(value) => setSelectedAnswer(value as "A" | "B" | "C" | "D")}
        className="space-y-3"
        disabled={disabled}
      >
        <div className="option-container">
          <Label className="flex items-start p-4 bg-white border border-gray-300 rounded-lg hover:bg-primary-50 cursor-pointer transition">
            <RadioGroupItem value="A" className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500" />
            <span className="ml-3">
              <span className="block font-medium text-gray-800">{question.optionA}</span>
            </span>
          </Label>
        </div>
        
        <div className="option-container">
          <Label className="flex items-start p-4 bg-white border border-gray-300 rounded-lg hover:bg-primary-50 cursor-pointer transition">
            <RadioGroupItem value="B" className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500" />
            <span className="ml-3">
              <span className="block font-medium text-gray-800">{question.optionB}</span>
            </span>
          </Label>
        </div>
        
        <div className="option-container">
          <Label className="flex items-start p-4 bg-white border border-gray-300 rounded-lg hover:bg-primary-50 cursor-pointer transition">
            <RadioGroupItem value="C" className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500" />
            <span className="ml-3">
              <span className="block font-medium text-gray-800">{question.optionC}</span>
            </span>
          </Label>
        </div>
        
        <div className="option-container">
          <Label className="flex items-start p-4 bg-white border border-gray-300 rounded-lg hover:bg-primary-50 cursor-pointer transition">
            <RadioGroupItem value="D" className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500" />
            <span className="ml-3">
              <span className="block font-medium text-gray-800">{question.optionD}</span>
            </span>
          </Label>
        </div>
      </RadioGroup>
      
      <div className="mt-8 flex justify-end">
        <Button 
          onClick={selectedAnswer ? handleSubmit : onNext}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
          disabled={disabled}
        >
          {currentIndex === totalQuestions - 1 ? "Finish Quiz" : "Next Question"}
        </Button>
      </div>
    </div>
  );
}
