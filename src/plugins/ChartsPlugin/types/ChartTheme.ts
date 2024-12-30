export interface ChartColorTheme {
  primary: string[];
  secondary: string[];
  background: string;
  text: string;
  grid: string;
  border: string;
  highlight: string;
}

export interface ChartFontTheme {
  family: string;
  size: {
    title: number;
    label: number;
    tick: number;
    legend: number;
  };
  weight: {
    normal: number;
    bold: number;
  };
}

export interface ChartTheme {
  colors: ChartColorTheme;
  fonts: ChartFontTheme;
  borderRadius: number;
  shadows: {
    light: string;
    medium: string;
    strong: string;
  };
  transitions: {
    duration: string;
    timing: string;
  };
}

export const defaultChartTheme: ChartTheme = {
  colors: {
    primary: [
      'rgb(59, 130, 246)', // Blue
      'rgb(239, 68, 68)', // Red
      'rgb(16, 185, 129)', // Green
      'rgb(245, 158, 11)', // Yellow
      'rgb(99, 102, 241)', // Indigo
      'rgb(236, 72, 153)', // Pink
      'rgb(139, 92, 246)', // Purple
      'rgb(20, 184, 166)', // Teal
      'rgb(249, 115, 22)', // Orange
      'rgb(6, 182, 212)', // Cyan
    ],
    secondary: [
      'rgba(59, 130, 246, 0.2)',
      'rgba(239, 68, 68, 0.2)',
      'rgba(16, 185, 129, 0.2)',
      'rgba(245, 158, 11, 0.2)',
      'rgba(99, 102, 241, 0.2)',
      'rgba(236, 72, 153, 0.2)',
      'rgba(139, 92, 246, 0.2)',
      'rgba(20, 184, 166, 0.2)',
      'rgba(249, 115, 22, 0.2)',
      'rgba(6, 182, 212, 0.2)',
    ],
    background: '#ffffff',
    text: '#374151',
    grid: '#e5e7eb',
    border: '#d1d5db',
    highlight: '#3b82f6',
  },
  fonts: {
    family: 'Inter, system-ui, sans-serif',
    size: {
      title: 16,
      label: 14,
      tick: 12,
      legend: 12,
    },
    weight: {
      normal: 400,
      bold: 600,
    },
  },
  borderRadius: 8,
  shadows: {
    light: '0 1px 2px rgba(0, 0, 0, 0.05)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    strong: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  transitions: {
    duration: '200ms',
    timing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
