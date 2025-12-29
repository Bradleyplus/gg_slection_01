
export interface Student {
  id: string;
  name: string;
  group?: string;
}

export interface HistoryItem {
  timestamp: number;
  student: Student;
  challenge?: string;
}

export interface AppState {
  students: Student[];
  history: HistoryItem[];
  isSpinning: boolean;
  selectedStudent: Student | null;
  aiChallenge: string | null;
}
