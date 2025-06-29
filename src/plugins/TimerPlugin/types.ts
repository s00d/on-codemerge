export interface Timer {
  id: string;
  title: string;
  description?: string;
  targetDate: Date; // Изменено с string на Date
  targetTime: string; // HH:mm format
  color?: string;
  category?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CreateTimerData {
  title: string;
  description?: string;
  targetDate: Date; // Изменено с string на Date
  targetTime: string;
  color?: string;
  category?: string;
  tags?: string[];
}

export interface UpdateTimerData {
  title?: string;
  description?: string;
  targetDate?: Date; // Изменено с string на Date
  targetTime?: string;
  color?: string;
  category?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface TimerTimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} 