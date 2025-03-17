import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { User, LoginCredentials } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<User | null>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Check if user is already authenticated
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/auth/me'],
    onSuccess: (data) => {
      if (data.user) {
        setUser(data.user);
      }
    },
    onError: () => {
      setUser(null);
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await apiRequest('POST', '/api/auth/login', credentials);
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      setError(null);
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.username}!`,
      });

      // Redirect based on user role
      if (data.user.role === 'student') {
        navigate('/rules');
      } else if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'superadmin') {
        navigate('/superadmin');
      }
    },
    onError: (error: any) => {
      const message = error.message || "Failed to login";
      setError(message);
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/auth/logout', {});
      return res.json();
    },
    onSuccess: () => {
      setUser(null);
      navigate('/');
      toast({
        title: "Logged out successfully",
      });
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    },
  });

  const login = async (credentials: LoginCredentials) => {
    try {
      const result = await loginMutation.mutateAsync(credentials);
      return result.user;
    } catch (error) {
      return null;
    }
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Provide authentication context
  const value = {
    user,
    loading: isLoading || loginMutation.isPending || logoutMutation.isPending,
    login,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
