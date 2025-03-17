import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["student", "admin", "superadmin"]),
  school: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});

type FormData = z.infer<typeof formSchema>;

interface UserFormProps {
  initialData?: any;
  userId?: number;
  onSuccess?: () => void;
  defaultRole?: "student" | "admin" | "superadmin";
}

export default function UserForm({ 
  initialData, 
  userId, 
  onSuccess,
  defaultRole = "student"
}: UserFormProps) {
  const { toast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Fetch schools for dropdown
  const { data: schools = [] } = useQuery({
    queryKey: ["/api/schools"],
  });
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      username: "",
      password: "",
      role: defaultRole,
      school: "",
      email: "",
      status: "active",
    },
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User created successfully",
        variant: "default",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      setSubmitError(error.message || "Failed to create user");
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("PUT", `/api/users/${userId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
        variant: "default",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      setSubmitError(error.message || "Failed to update user");
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormData) => {
    setSubmitError(null);
    
    // If role is not student, remove school
    if (data.role !== "student") {
      data.school = "";
    }
    
    if (userId) {
      // Don't send password if it's empty (for updates)
      if (!data.password) {
        const { password, ...restData } = data;
        updateMutation.mutate(restData as FormData);
      } else {
        updateMutation.mutate(data);
      }
    } else {
      createMutation.mutate(data);
    }
  };
  
  const selectedRole = form.watch("role");
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Enter username" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
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
              <FormLabel>{userId ? "New Password (leave empty to keep current)" : "Password"}</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="password" 
                  placeholder={userId ? "Enter new password or leave empty" : "Enter password"} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required={!userId}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="email"
                  placeholder="Enter email address (optional)" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <SelectValue placeholder="Select user role" />
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
        
        {selectedRole === "student" && (
          <FormField
            control={form.control}
            name="school"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <SelectValue placeholder="Select student's school" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {schools.map((school: { id: number; name: string }) => (
                      <SelectItem key={school.id} value={school.name}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <SelectValue placeholder="Select user status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {submitError && (
          <div className="text-red-500 text-sm">{submitError}</div>
        )}
        
        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={onSuccess}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {userId ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
