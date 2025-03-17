import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertQuestionSchema, insertQuizAnswerSchema, insertResultSchema, loginSchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from "zod";

// Create session store
const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "math-competition-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 86400000 }, // 24 hours
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // 24 hours
      }),
    })
  );

  // Auth middleware for different roles
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.session.user || (req.session.user.role !== "admin" && req.session.user.role !== "superadmin")) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    next();
  };

  const requireSuperAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.session.user || req.session.user.role !== "superadmin") {
      return res.status(403).json({ message: "Forbidden: Super Admin access required" });
    }
    next();
  };

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(credentials.username);

      if (!user || user.password !== credentials.password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Don't allow students to login if school doesn't match
      if (user.role === "student" && credentials.school && user.school !== credentials.school) {
        return res.status(401).json({ message: "Invalid school selected" });
      }

      // Update last login
      await storage.updateUser(user.id, { 
        lastLogin: new Date() 
      });

      // Store user in session (exclude password)
      const { password, ...userWithoutPassword } = user;
      req.session.user = userWithoutPassword;

      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ user: req.session.user });
  });

  // User routes
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.listUsers();
      // Remove passwords from response
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireSuperAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const newUser = await storage.createUser(userData);
      // Don't return password
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      
      const updatedUser = await storage.updateUser(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteUser(id);
      
      if (!result) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Question routes
  app.get("/api/questions", requireAuth, async (req, res) => {
    try {
      const questions = await storage.listQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post("/api/questions", requireAdmin, async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      
      const newQuestion = await storage.createQuestion({
        ...questionData,
        createdBy: req.session.user?.id,
      });
      
      res.status(201).json(newQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.put("/api/questions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const questionData = insertQuestionSchema.partial().parse(req.body);
      
      const updatedQuestion = await storage.updateQuestion(id, questionData);
      if (!updatedQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json(updatedQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteQuestion(id);
      
      if (!result) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Quiz settings routes
  app.get("/api/quiz/settings", async (req, res) => {
    try {
      const settings = await storage.getQuizSettings();
      res.json(settings || { state: "waiting" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz settings" });
    }
  });

  app.post("/api/quiz/start", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.startQuiz();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to start quiz" });
    }
  });

  app.post("/api/quiz/reset", requireSuperAdmin, async (req, res) => {
    try {
      const settings = await storage.resetQuiz();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to reset quiz" });
    }
  });

  // Quiz answers routes
  app.post("/api/quiz/answers", requireAuth, async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const answerData = insertQuizAnswerSchema.parse(req.body);
      
      // Ensure the user is submitting their own answers
      if (answerData.userId !== req.session.user.id) {
        return res.status(403).json({ message: "Cannot submit answers for another user" });
      }
      
      const savedAnswer = await storage.saveQuizAnswer(answerData);
      res.status(201).json(savedAnswer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to save answer" });
    }
  });

  app.get("/api/quiz/answers", requireAuth, async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.session.user.id;
      const answers = await storage.getQuizAnswersForUser(userId);
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch answers" });
    }
  });

  // Results routes
  app.post("/api/results", requireAuth, async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const resultData = insertResultSchema.parse(req.body);
      
      // Ensure the user is submitting their own results
      if (resultData.userId !== req.session.user.id) {
        return res.status(403).json({ message: "Cannot submit results for another user" });
      }
      
      const savedResult = await storage.saveResult(resultData);
      res.status(201).json(savedResult);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to save result" });
    }
  });

  app.get("/api/results", requireAuth, async (req, res) => {
    try {
      const results = await storage.listResults();
      
      // Only admin can see all results, students can only see their own
      if (req.session.user && (req.session.user.role === "admin" || req.session.user.role === "superadmin")) {
        return res.json(results);
      }
      
      // For students, return all results but without usernames (just ranks and scores)
      const sanitizedResults = results.map(result => {
        if (result.userId === req.session.user?.id) {
          return result; // Return full data for the current user
        }
        return {
          ...result,
          userId: 0, // Hide the actual user ID
        };
      });
      
      res.json(sanitizedResults);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  app.get("/api/results/me", requireAuth, async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.session.user.id;
      const result = await storage.getResult(userId);
      
      if (!result) {
        return res.status(404).json({ message: "No result found" });
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch result" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
