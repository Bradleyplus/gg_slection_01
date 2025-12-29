
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
