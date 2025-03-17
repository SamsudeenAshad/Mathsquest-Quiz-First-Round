import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  optionA: z.string().min(1, "Option A is required"),
  optionB: z.string().min(1, "Option B is required"),
  optionC: z.string().min(1, "Option C is required"),
  optionD: z.string().min(1, "Option D is required"),
  correctAnswer: z.enum(["A", "B", "C", "D"], {
    required_error: "Please select the correct answer",
  }),
  category: z.string().min(1, "Category is required"),
});

type FormData = z.infer<typeof formSchema>;

interface QuestionFormProps {
  initialData?: FormData;
  questionId?: number;
  onSuccess?: () => void;
}

export default function QuestionForm({ initialData, questionId, onSuccess }: QuestionFormProps) {
  const { toast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      text: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: undefined,
      category: "",
    },
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/questions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Success",
        description: "Question created successfully",
        variant: "default",
      });
      form.reset({
        text: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: undefined,
        category: "",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      setSubmitError(error.message || "Failed to create question");
      toast({
        title: "Error",
        description: error.message || "Failed to create question",
        variant: "destructive",
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("PUT", `/api/questions/${questionId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Success",
        description: "Question updated successfully",
        variant: "default",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      setSubmitError(error.message || "Failed to update question");
      toast({
        title: "Error",
        description: error.message || "Failed to update question",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormData) => {
    setSubmitError(null);
    if (questionId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Enter the mathematics question here" 
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  <Input 
                    {...field} 
                    placeholder="Enter option A" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
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
                  <Input 
                    {...field} 
                    placeholder="Enter option B" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
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
                  <Input 
                    {...field} 
                    placeholder="Enter option C" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
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
                  <Input 
                    {...field} 
                    placeholder="Enter option D" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="A" />
                    </FormControl>
                    <FormLabel className="font-normal">A</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="B" />
                    </FormControl>
                    <FormLabel className="font-normal">B</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="C" />
                    </FormControl>
                    <FormLabel className="font-normal">C</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="D" />
                    </FormControl>
                    <FormLabel className="font-normal">D</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="algebra">Algebra</SelectItem>
                  <SelectItem value="geometry">Geometry</SelectItem>
                  <SelectItem value="calculus">Calculus</SelectItem>
                  <SelectItem value="statistics">Statistics</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {submitError && (
          <div className="text-red-500 text-sm">{submitError}</div>
        )}
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {questionId ? "Update Question" : "Save Question"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
