import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Extended schema for validation
const formSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  role: z.enum(["student", "admin", "superadmin"]),
  school: z.string().optional(),
});

type UserFormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  defaultValues?: Partial<UserFormValues>;
  userId?: number;
  onSuccess?: () => void;
}

export default function UserForm({ defaultValues, userId, onSuccess }: UserFormProps) {
  const { toast } = useToast();
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      username: "",
      password: "",
      role: "student",
      school: undefined,
    },
  });
  
  const saveUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      if (userId) {
        // Update existing user
        return apiRequest("PUT", `/api/users/${userId}`, data);
      } else {
        // Create new user
        return apiRequest("POST", "/api/users", data);
      }
    },
    onSuccess: () => {
      toast({
        title: userId ? "User updated" : "User created",
        description: userId 
          ? "The user has been updated successfully." 
          : "The user has been created successfully.",
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: userId ? "Failed to update user" : "Failed to create user",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(values: UserFormValues) {
    // For student role, school is required
    if (values.role === "student" && !values.school) {
      form.setError("school", {
        type: "manual",
        message: "School is required for students",
      });
      return;
    }
    
    saveUserMutation.mutate(values);
  }
  
  // Watch the role field to conditionally show school field
  const role = form.watch("role");
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User Type</FormLabel>
              <Select 
                value={field.value} 
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="Enter password" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {role === "student" && (
          <FormField
            control={form.control}
            name="school"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School</FormLabel>
                <Select 
                  value={field.value || ""} 
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a school" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Royal College">Royal College</SelectItem>
                    <SelectItem value="Visakha Vidyalaya">Visakha Vidyalaya</SelectItem>
                    <SelectItem value="Ananda College">Ananda College</SelectItem>
                    <SelectItem value="Devi Balika Vidyalaya">Devi Balika Vidyalaya</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <div className="flex justify-end">
          <Button 
            type="submit"
            disabled={saveUserMutation.isPending}
          >
            {saveUserMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {userId ? "Updating User..." : "Creating User..."}
              </>
            ) : (
              userId ? "Update User" : "Create User"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
