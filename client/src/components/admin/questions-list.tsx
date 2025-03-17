import { useState } from "react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  category: string;
}

interface QuestionsListProps {
  questions: Question[];
  onEdit: (question: Question) => void;
}

export default function QuestionsList({ questions, onEdit }: QuestionsListProps) {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/questions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Success",
        description: "Question deleted successfully",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete question",
        variant: "destructive",
      });
    },
  });
  
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
    setDeleteId(null);
  };
  
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'algebra':
        return 'bg-blue-100 text-blue-800';
      case 'geometry':
        return 'bg-green-100 text-green-800';
      case 'calculus':
        return 'bg-purple-100 text-purple-800';
      case 'statistics':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>Question</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Correct Answer</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((question) => (
            <TableRow key={question.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">Q{question.id}</TableCell>
              <TableCell className="max-w-md truncate">{question.text}</TableCell>
              <TableCell>
                <Badge className={getCategoryColor(question.category)} variant="outline">
                  {question.category.charAt(0).toUpperCase() + question.category.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>{question.correctAnswer}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(question)}
                  className="text-primary-600 hover:text-primary-900 mr-3"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <AlertDialog open={deleteId === question.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(question.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the question.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(question.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
          
          {questions.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                No questions added yet. Use the form above to add questions.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {questions.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{questions.length}</span> of <span className="font-medium">{questions.length}</span> questions
          </div>
        </div>
      )}
    </div>
  );
}
