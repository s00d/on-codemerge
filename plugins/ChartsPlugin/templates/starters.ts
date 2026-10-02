import type { ChartType, ChartSeries } from '../types';

/** Studio quick-start templates (driver defaults cover blank type switch). */
export const CHART_TEMPLATES: {
  key: string;
  name: string;
  type: ChartType;
  data: ChartSeries[];
}[] = [
  {
    key: 'bar-sales',
    name: 'Bar: Sales',
    type: 'bar',
    data: [
      {
        name: 'Sales',
        data: [
          { label: 'Jan', value: 120 },
          { label: 'Feb', value: 90 },
          { label: 'Mar', value: 150 },
        ],
      },
    ],
  },
  {
    key: 'pie-expenses',
    name: 'Pie: Expenses',
    type: 'pie',
    data: [
      {
        name: 'Expenses',
        data: [
          { label: 'Rent', value: 40 },
          { label: 'Salary', value: 30 },
          { label: 'Other', value: 30 },
        ],
      },
    ],
  },
];
