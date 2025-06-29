export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration?: number; // в минутах
  location?: string;
  color?: string;
  isAllDay?: boolean;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  tags?: string[];
  attendees?: string[];
  reminder?: number; // минуты до события
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
  createdAt: number;
  updatedAt: number;
}

export interface Calendar {
  id: string;
  title: string;
  description?: string;
  events: CalendarEvent[];
  createdAt: number;
  updatedAt: number;
}

export interface CreateEventData {
  title: string;
  description?: string;
  date: string;
  time: string;
  duration?: number;
  location?: string;
  color?: string;
  isAllDay?: boolean;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  tags?: string[];
  attendees?: string[];
  reminder?: number;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
}

export interface CreateCalendarData {
  title: string;
  description?: string;
  events?: CreateEventData[];
}

export interface UpdateEventData extends Partial<CreateEventData> {}

export interface UpdateCalendarData extends Partial<CreateCalendarData> {}

// Новые типы для категорий и тегов
export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

// Типы для напоминаний
export interface Reminder {
  id: string;
  eventId: string;
  calendarId: string;
  triggerTime: number; // timestamp
  message: string;
  isShown: boolean;
  createdAt: number;
}

// Типы для повторяющихся событий
export interface RecurringEvent {
  id: string;
  baseEventId: string;
  calendarId: string;
  nextOccurrence: string;
  pattern: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  createdAt: number;
} 