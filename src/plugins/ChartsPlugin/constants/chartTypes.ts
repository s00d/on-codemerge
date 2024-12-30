import {
  barIcon,
  lineIcon,
  pieIcon,
  doughnutIcon,
  areaIcon,
  radarIcon,
  scatterIcon,
  bubbleIcon,
} from '../../../icons';

export const CHART_TYPE_CONFIGS = {
  bar: {
    name: 'Bar Chart',
    supportsMultipleSeries: false,
    icon: barIcon,
  },
  line: {
    name: 'Line Chart',
    supportsMultipleSeries: true,
    icon: lineIcon,
  },
  pie: {
    name: 'Pie Chart',
    supportsMultipleSeries: false,
    icon: pieIcon,
  },
  doughnut: {
    name: 'Doughnut Chart',
    supportsMultipleSeries: false,
    icon: doughnutIcon,
  },
  area: {
    name: 'Area Chart',
    supportsMultipleSeries: true,
    icon: areaIcon,
  },
  radar: {
    name: 'Radar Chart',
    supportsMultipleSeries: true,
    icon: radarIcon,
  },
  scatter: {
    name: 'Scatter Plot',
    supportsMultipleSeries: true,
    requiresXY: true,
    icon: scatterIcon,
  },
  bubble: {
    name: 'Bubble Chart',
    supportsMultipleSeries: true,
    requiresXY: true,
    icon: bubbleIcon,
  },
} as const;
