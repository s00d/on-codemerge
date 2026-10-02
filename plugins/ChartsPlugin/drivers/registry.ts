import {
  areaIcon,
  barIcon,
  bubbleIcon,
  doughnutIcon,
  lineIcon,
  pieIcon,
  radarIcon,
  scatterIcon,
} from '@ocm/wysiwyg/icons';
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
import { paintCategorical } from './categorical';
import { paintPolar } from './polar';
import { paintRadar } from './radar';
import { paintXy } from './xy';

const CAT_FIELDS = ['label', 'value', 'color'] as const satisfies readonly PointField[];
const XY_FIELDS = ['label', 'x', 'y', 'color'] as const satisfies readonly PointField[];
const BUBBLE_FIELDS = ['label', 'x', 'y', 'r', 'color'] as const satisfies readonly PointField[];

function cat(
  type: 'bar' | 'line' | 'area',
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
    supportsOrientation: type === 'bar',
    defaults: categoricalDefaults,
    coerce: coerceCategorical,
    paint: (ctx, series, options, i18n) => paintCategorical(type, ctx, series, options, i18n),
    ...extra,
  };
}

export const DRIVERS: Record<ChartType, ChartDriver> = {
  bar: cat('bar', 'Bar Chart', barIcon),
  line: cat('line', 'Line Chart', lineIcon, { supportsMode: false, supportsOrientation: false }),
  area: cat('area', 'Area Chart', areaIcon, { supportsOrientation: false }),
  radar: {
    type: 'radar',
    family: 'categorical',
    name: 'Radar Chart',
    icon: radarIcon,
    seriesMode: 'multi',
    fields: CAT_FIELDS,
    defaults: categoricalDefaults,
    coerce: coerceCategorical,
    paint: paintRadar,
  },
  pie: {
    type: 'pie',
    family: 'polar',
    name: 'Pie Chart',
    icon: pieIcon,
    seriesMode: 'single',
    fields: CAT_FIELDS,
    supportsOrientation: true,
    defaults: polarDefaults,
    coerce: coercePolar,
    paint: (ctx, series, options, i18n) => paintPolar(ctx, series, options, i18n, 0),
  },
  doughnut: {
    type: 'doughnut',
    family: 'polar',
    name: 'Doughnut Chart',
    icon: doughnutIcon,
    seriesMode: 'single',
    fields: CAT_FIELDS,
    hole: 0.55,
    supportsOrientation: true,
    defaults: polarDefaults,
    coerce: coercePolar,
    paint: (ctx, series, options, i18n) => paintPolar(ctx, series, options, i18n, 0.55),
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
