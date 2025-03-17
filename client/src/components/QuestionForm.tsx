import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertQuestionSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Extend the question schema for validation
const formSchema = insertQuestionSchema.extend({
  questionText: z.string().min(5, "Question text is required"),
  optionA: z.string().min(1, "Option A is required"),
  optionB: z.string().min(1, "Option B is required"),
  optionC: z.string().min(1, "Option C is required"),
  optionD: z.string().min(1, "Option D is required"),
  correctAnswer: z.enum(["A", "B", "C", "D"], {
    required_error: "Please select the correct answer",
  }),
  difficulty: z.enum(["easy", "medium", "hard"], {
    required_error: "Please select difficulty level",
  }),
});

type QuestionFormValues = z.infer<typeof formSchema>;

interface QuestionFormProps {
  defaultValues?: Partial<QuestionFormValues>;
  questionId?: number;
  onSuccess?: () => void;
}

export default function QuestionForm({ defaultValues, questionId, onSuccess }: QuestionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: undefined,
      difficulty: "medium"
    },
  });

  const saveQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      if (questionId) {
        // Update existing question
        return apiRequest("PUT", `/api/questions/${questionId}`, data);
      } else {
        // Create new question
        return apiRequest("POST", "/api/questions", data);
      }
    },
    onSuccess: () => {
      toast({
        title: questionId ? "Question updated" : "Question added",
        description: questionId 
          ? "The question has been updated successfully." 
          : "The question has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: questionId ? "Failed to update question" : "Failed to add question",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: QuestionFormValues) {
    saveQuestionMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="questionText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter the mathematical question here..." 
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="optionA"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Option A</FormLabel>
                <FormControl>
                  <Input placeholder="Enter option A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="optionB"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Option B</FormLabel>
                <FormControl>
                  <Input placeholder="Enter option B" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="optionC"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Option C</FormLabel>
                <FormControl>
                  <Input placeholder="Enter option C" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="optionD"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Option D</FormLabel>
                <FormControl>
                  <Input placeholder="Enter option D" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="correctAnswer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correct Answer</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="A" id="r1" />
                      <label htmlFor="r1">A</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="B" id="r2" />
                      <label htmlFor="r2">B</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="C" id="r3" />
                      <label htmlFor="r3">C</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="D" id="r4" />
                      <label htmlFor="r4">D</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Difficulty Level</FormLabel>
                <Select 
                  value={field.value} 
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end">
          <Button 
            type="submit"
            disabled={saveQuestionMutation.isPending}
          >
            {saveQuestionMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {questionId ? "Updating..." : "Adding..."}
              </>
            ) : (
              questionId ? "Update Question" : "Add Question"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
