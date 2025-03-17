import { users, questions, quizSettings, quizAnswers, results, type User, type InsertUser, type Question, type InsertQuestion, type QuizSetting, type InsertQuizSetting, type QuizAnswer, type InsertQuizAnswer, type Result, type InsertResult } from "@shared/schema";

// Storage interface
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(): Promise<User[]>;
  
  // Question management
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  listQuestions(): Promise<Question[]>;
  
  // Quiz settings
  getQuizSettings(): Promise<QuizSetting | undefined>;
  createOrUpdateQuizSettings(settings: Partial<InsertQuizSetting>): Promise<QuizSetting>;
  startQuiz(): Promise<QuizSetting>;
  resetQuiz(): Promise<QuizSetting>;
  
  // Quiz answers
  saveQuizAnswer(answer: InsertQuizAnswer): Promise<QuizAnswer>;
  getQuizAnswersForUser(userId: number): Promise<QuizAnswer[]>;
  
  // Results
  getResult(userId: number): Promise<Result | undefined>;
  saveResult(result: InsertResult): Promise<Result>;
  listResults(): Promise<Result[]>;
  calculateRankings(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private questions: Map<number, Question>;
  private quizSettings: QuizSetting | undefined;
  private quizAnswers: Map<number, QuizAnswer>;
  private results: Map<number, Result>;
  
  private userIdCounter: number;
  private questionIdCounter: number;
  private quizAnswerIdCounter: number;
  private resultIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.questions = new Map();
    this.quizAnswers = new Map();
    this.results = new Map();
    
    this.userIdCounter = 1;
    this.questionIdCounter = 1;
    this.quizAnswerIdCounter = 1;
    this.resultIdCounter = 1;
    
    // Create default quiz settings
    this.quizSettings = {
      id: 1,
      state: 'waiting',
      startTime: null,
      endTime: null,
      lastReset: null,
      updatedAt: new Date(),
    };
    
    // Create default admin and superadmin accounts
    this.createUser({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
    });
    
    this.createUser({
      username: 'superadmin',
      password: 'superadmin123',
      role: 'superadmin',
    });
  }
  
  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      lastLogin: null,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...userData,
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Question management
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }
  
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.questionIdCounter++;
    const now = new Date();
    const question: Question = {
      ...insertQuestion,
      id,
      createdAt: now,
    };
    this.questions.set(id, question);
    return question;
  }
  
  async updateQuestion(id: number, questionData: Partial<InsertQuestion>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion: Question = {
      ...question,
      ...questionData,
    };
    
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }
  
  async listQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values());
  }
  
  // Quiz settings
  async getQuizSettings(): Promise<QuizSetting | undefined> {
    return this.quizSettings;
  }
  
  async createOrUpdateQuizSettings(settings: Partial<InsertQuizSetting>): Promise<QuizSetting> {
    const now = new Date();
    
    if (!this.quizSettings) {
      this.quizSettings = {
        id: 1,
        state: settings.state || 'waiting',
        startTime: null,
        endTime: null,
        lastReset: null,
        updatedAt: now,
      };
    } else {
      this.quizSettings = {
        ...this.quizSettings,
        ...settings,
        updatedAt: now,
      };
    }
    
    return this.quizSettings;
  }
  
  async startQuiz(): Promise<QuizSetting> {
    const now = new Date();
    if (!this.quizSettings) {
      this.quizSettings = {
        id: 1,
        state: 'started',
        startTime: now,
        endTime: null,
        lastReset: null,
        updatedAt: now,
      };
    } else {
      this.quizSettings = {
        ...this.quizSettings,
        state: 'started',
        startTime: now,
        updatedAt: now,
      };
    }
    
    return this.quizSettings;
  }
  
  async resetQuiz(): Promise<QuizSetting> {
    const now = new Date();
    
    this.quizSettings = {
      id: 1,
      state: 'waiting',
      startTime: null,
      endTime: null,
      lastReset: now,
      updatedAt: now,
    };
    
    // Clear all results and answers
    this.quizAnswers.clear();
    this.results.clear();
    this.quizAnswerIdCounter = 1;
    this.resultIdCounter = 1;
    
    return this.quizSettings;
  }
  
  // Quiz answers
  async saveQuizAnswer(insertAnswer: InsertQuizAnswer): Promise<QuizAnswer> {
    const id = this.quizAnswerIdCounter++;
    const now = new Date();
    
    // Check if the answer is correct
    const question = this.questions.get(insertAnswer.questionId);
    const isCorrect = question ? 
      (question.correctAnswer === insertAnswer.userAnswer) : false;
    
    const answer: QuizAnswer = {
      ...insertAnswer,
      id,
      isCorrect,
      createdAt: now,
    };
    
    this.quizAnswers.set(id, answer);
    return answer;
  }
  
  async getQuizAnswersForUser(userId: number): Promise<QuizAnswer[]> {
    return Array.from(this.quizAnswers.values())
      .filter(answer => answer.userId === userId);
  }
  
  // Results
  async getResult(userId: number): Promise<Result | undefined> {
    return Array.from(this.results.values())
      .find(result => result.userId === userId);
  }
  
  async saveResult(insertResult: InsertResult): Promise<Result> {
    const id = this.resultIdCounter++;
    const now = new Date();
    
    const result: Result = {
      ...insertResult,
      id,
      createdAt: now,
    };
    
    this.results.set(id, result);
    
    // Calculate rankings
    await this.calculateRankings();
    
    return this.results.get(id) as Result;
  }
  
  async listResults(): Promise<Result[]> {
    return Array.from(this.results.values());
  }
  
  async calculateRankings(): Promise<void> {
    // Sort results by score in descending order
    const sortedResults = Array.from(this.results.values())
      .sort((a, b) => b.score - a.score);
    
    // Update rank for each result
    sortedResults.forEach((result, index) => {
      const updatedResult = {
        ...result,
        rank: index + 1
      };
      this.results.set(result.id, updatedResult);
    });
  }
}

export const storage = new MemStorage();
