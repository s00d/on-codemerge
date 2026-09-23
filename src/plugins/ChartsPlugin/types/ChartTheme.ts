import { hueStrip } from '../../../utils/colorMath';
import { colorWithOpacity } from '../utils/colors';

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

function palette(count = 10): Pick<ChartColorTheme, 'primary' | 'secondary' | 'highlight'> {
  const primary = hueStrip(count);
  return {
    primary,
    secondary: primary.map((c) => colorWithOpacity(c, 0.2)),
    highlight: primary[0],
  };
}

const sharedFonts: ChartFontTheme = {
  family: 'system-ui, sans-serif',
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
};

const sharedTransitions = {
  duration: '200ms',
  timing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

export const defaultChartTheme: ChartTheme = {
  colors: {
    ...palette(10),
    background: '#ffffff',
    text: '#374151',
    grid: '#e5e7eb',
    border: '#d1d5db',
  },
  fonts: sharedFonts,
  borderRadius: 8,
  shadows: {
    light: '0 1px 2px rgba(0, 0, 0, 0.05)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    strong: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  transitions: sharedTransitions,
};

export const darkChartTheme: ChartTheme = {
  colors: {
    ...palette(10),
    background: '#18181b',
    text: '#f3f4f6',
    grid: '#27272a',
    border: '#3f3f46',
  },
  fonts: sharedFonts,
  borderRadius: 8,
  shadows: {
    light: '0 1px 2px rgba(0, 0, 0, 0.15)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.25)',
    strong: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
  },
  transitions: sharedTransitions,
};

export const chartThemes = [
  { key: 'light', name: 'Светлая', theme: defaultChartTheme },
  { key: 'dark', name: 'Тёмная', theme: darkChartTheme },
];
