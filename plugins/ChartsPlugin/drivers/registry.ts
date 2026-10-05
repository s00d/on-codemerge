import {
  areaIcon,
  barIcon,
  bubbleIcon,
  doughnutIcon,
  lineIcon,
  pieIcon,
  radarIcon,
  scatterIcon,
} from '@codemerge/sdk/icons';
import type { ChartType } from '../types';
import type { ChartDriver, PointField } from './types';
import {
  categoricalDefaults,
  coerceCategorical,
  coercePolar,
  coerceXy,
  polarDefaults,
  xyDefaults,
} from './coerce';
import { paintXy } from './xy';

const CAT_FIELDS = ['label', 'value', 'color'] as const satisfies readonly PointField[];
const XY_FIELDS = ['label', 'x', 'y', 'color'] as const satisfies readonly PointField[];
const BUBBLE_FIELDS = ['label', 'x', 'y', 'r', 'color'] as const satisfies readonly PointField[];

function cat(
  type: 'bar' | 'line' | 'area' | 'radar',
  name: string,
  icon: string,
  extra?: Partial<ChartDriver>
): ChartDriver {
  return {
    type,
    family: 'categorical',
    name,
    icon,
    seriesMode: 'multi',
    fields: CAT_FIELDS,
    supportsMode: type === 'bar' || type === 'area',
    // Mermaid xychart path has no horizontal bars yet — hide until wired.
    supportsOrientation: false,
    defaults: categoricalDefaults,
    coerce: coerceCategorical,
    ...extra,
  };
}

export const DRIVERS: Record<ChartType, ChartDriver> = {
  bar: cat('bar', 'Bar Chart', barIcon),
  line: cat('line', 'Line Chart', lineIcon, { supportsMode: false, supportsOrientation: false }),
  area: cat('area', 'Area Chart', areaIcon, { supportsOrientation: false }),
  radar: cat('radar', 'Radar Chart', radarIcon, {
    supportsMode: false,
    supportsOrientation: false,
  }),
  pie: {
    type: 'pie',
    family: 'polar',
    name: 'Pie Chart',
    icon: pieIcon,
    seriesMode: 'single',
    fields: CAT_FIELDS,
    supportsOrientation: false,
    defaults: polarDefaults,
    coerce: coercePolar,
  },
  doughnut: {
    type: 'doughnut',
    family: 'polar',
    name: 'Doughnut Chart',
    icon: doughnutIcon,
    seriesMode: 'single',
    fields: CAT_FIELDS,
    hole: 0.55,
    supportsOrientation: false,
    defaults: polarDefaults,
    coerce: coercePolar,
  },
  scatter: {
    type: 'scatter',
    family: 'xy',
    name: 'Scatter Plot',
    icon: scatterIcon,
    seriesMode: 'single',
    fields: XY_FIELDS,
    defaults: () => xyDefaults(false),
    coerce: (from) => coerceXy(from, false),
    paint: (ctx, series, options, i18n) => paintXy(ctx, series, options, i18n, false),
  },
  bubble: {
    type: 'bubble',
    family: 'xy',
    name: 'Bubble Chart',
    icon: bubbleIcon,
    seriesMode: 'single',
    fields: BUBBLE_FIELDS,
    defaults: () => xyDefaults(true),
    coerce: (from) => coerceXy(from, true),
    paint: (ctx, series, options, i18n) => paintXy(ctx, series, options, i18n, true),
  },
};

export function getDriver(type: ChartType): ChartDriver {
  return DRIVERS[type];
}

export function allChartTypes(): ChartType[] {
  return ['bar', 'line', 'pie', 'doughnut', 'area', 'radar', 'scatter', 'bubble'];
}
