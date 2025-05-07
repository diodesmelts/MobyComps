import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpCircle } from "lucide-react";

interface QuizQuestionProps {
  question: string;
  options: string[];
  correctAnswer: string;
  onAnswerSubmit: (isCorrect: boolean) => void;
}

export function QuizQuestion({
  question,
  options,
  correctAnswer,
  onAnswerSubmit,
}: QuizQuestionProps) {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Define schema for the form
  const formSchema = z.object({
    answer: z.string({
      required_error: "Please select an answer",
    }),
  });
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      answer: "",
    },
  });
  
  // Form submission handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Perform case-insensitive string comparison and trim any whitespace
    const isCorrect = values.answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    console.log("Quiz answer check:", { 
      userAnswer: values.answer, 
      correctAnswer,
      isMatch: isCorrect
    });
    
    // Only lock the form if the answer is correct
    setHasSubmitted(isCorrect);
    onAnswerSubmit(isCorrect);
    
    // If the answer is incorrect, allow the user to try again
    if (!isCorrect) {
      // Reset the form after a short delay
      setTimeout(() => {
        form.reset();
      }, 500);
    }
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center text-sm text-[#002D5C] font-medium">
        <HelpCircle className="h-5 w-5 mr-1.5 text-[#002D5C]" />
        <span>Question</span>
      </div>
      <p className="text-sm text-gray-700">Please answer the following question correctly to continue</p>
      
      <Form {...form}>
        <form className="space-y-2">
          <FormField
            control={form.control}
            name="answer"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-[#002D5C]">{question}</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Manually call onSubmit when a value is selected
                    onSubmit({ answer: value });
                  }}
                  value={field.value}
                  disabled={hasSubmitted}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your answer!" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
