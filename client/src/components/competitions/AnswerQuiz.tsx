import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface AnswerQuizProps {
  quizQuestion: QuizQuestion;
  onAnswerSubmit: (answer: string) => void;
  isAnswered: boolean;
}

export default function AnswerQuiz({ 
  quizQuestion, 
  onAnswerSubmit, 
  isAnswered 
}: AnswerQuizProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  
  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
    onAnswerSubmit(value);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-start text-sm font-medium">
          <HelpCircle className="h-4 w-4 mr-2 mt-0.5 text-primary" />
          Question
        </CardTitle>
        <CardDescription>
          Please answer the following question correctly to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="font-medium mb-2">{quizQuestion.question}</div>
        <Select
          value={selectedAnswer}
          onValueChange={handleAnswerSelect}
          disabled={isAnswered}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select your answer" />
          </SelectTrigger>
          <SelectContent>
            {quizQuestion.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
