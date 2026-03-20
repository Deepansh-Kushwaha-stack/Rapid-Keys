export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  bestWpm: number;
  bestAccuracy: number;
  averageWpm: number;
  totalTests: number;
  createdAt: string;
  role?: 'user' | 'admin';
}

export interface TestResult {
  id?: string;
  userId: string;
  displayName: string;
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  duration: number;
  timestamp: string;
}

export type TestDuration = 30 | 60;
export type TestState = 'idle' | 'running' | 'finished';
